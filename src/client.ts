import net from 'net';
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import chalk from 'chalk';
import { Funko, FunkoType, FunkoGenre } from './funko.js'; // Necesita las definiciones
import { requestType, responseType, requestCommand } from './sharedTypes.js'; // Tipos compartidos
import { getMarketValueColor } from './chalkUtils.js'; // Para mostrar colores

const SERVER_PORT = 60300; // Puerto del servidor al que conectarse
const SERVER_HOST = 'localhost'; // Host del servidor

/**
 * Función para enviar una petición al servidor y manejar la respuesta.
 * @param request - El objeto de petición a enviar.
 */
function sendRequest(request: requestType) {
  const client = net.createConnection({ port: SERVER_PORT, host: SERVER_HOST }, () => {
    console.log(chalk.cyan('Connected to server. Sending request...'));
    // Enviar la petición al servidor
    client.write(JSON.stringify(request));
    // Indicar al servidor que hemos terminado de enviar datos para esta petición
    client.end();
  });

  let responseData = ''; // Buffer para la respuesta

  // Recibir datos del servidor
  client.on('data', (data) => {
    responseData += data.toString();
  });

  // Cuando el servidor cierra la conexión (después de enviar la respuesta)
  client.on('end', () => {
    console.log(chalk.cyan('Disconnected from server. Processing response...'));
    try {
      const response: responseType = JSON.parse(responseData);

      // Procesar y mostrar la respuesta usando Chalk
      if (response.success) {
        console.log(chalk.green('Success: ') + (response.message || `Operation ${response.type} completed.`));
        // Si la respuesta incluye Funkos (list, read), mostrarlos
        if (response.funkos && response.funkos.length > 0) {
           console.log("--------------------------------");
          response.funkos.forEach((funko) => {
            displayFunko(funko); // Usar función helper para mostrar
             console.log("--------------------------------");
          });
        } else if (response.type === 'list' && response.funkos?.length === 0) {
            // Mensaje específico para lista vacía aunque success sea true
             console.log(chalk.yellow(`${request.user} has no Funko collection.`));
        }

      } else {
        // Mostrar mensaje de error del servidor
        console.error(chalk.red('Error: ') + (response.message || `Operation ${response.type} failed.`));
      }
    } catch (error) {
      console.error(chalk.red('Error parsing server response:'), error);
      console.error(chalk.red('Raw response data:'), responseData);
    }
  });

  // Manejar errores de conexión
  client.on('error', (err) => {
    console.error(chalk.red('Connection error:'), err.message);
    if ((err as any).code === 'ECONNREFUSED') {
        console.error(chalk.red(`Could not connect to server at ${SERVER_HOST}:${SERVER_PORT}. Is the server running?`));
    }
  });
}

/**
 * Función helper para mostrar la información de un Funko con Chalk.
 * @param funko - El objeto Funko a mostrar.
 */
function displayFunko(funko: Funko) {
    const valueColor = getMarketValueColor(funko.marketValue);
    console.log(`ID: ${funko.id}`);
    console.log(`Name: ${funko.name}`);
    console.log(`Description: ${funko.description}`);
    console.log(`Type: ${funko.type}`);
    console.log(`Genre: ${funko.genre}`);
    console.log(`Franchise: ${funko.franchise}`);
    console.log(`Number: ${funko.number}`);
    console.log(`Exclusive: ${funko.exclusive ? "Yes" : "No"}`);
    console.log(`Special Features: ${funko.specialFeatures}`);
    console.log(`Market Value: ${valueColor(funko.marketValue)}`); // Aplica color
}

// --- Configuración de Yargs (similar al original, pero llama a sendRequest) ---

yargs(hideBin(process.argv))
  .command({
    command: 'add',
    describe: 'Add a new Funko Pop to a user collection',
    builder: {
      user: { type: 'string', demandOption: true, describe: 'Username of the collection owner' },
      id: { type: 'number', demandOption: true, describe: 'Unique ID for the Funko' },
      name: { type: 'string', demandOption: true, describe: 'Name of the Funko' },
      desc: { type: 'string', demandOption: true, describe: 'Description of the Funko' },
      type: { choices: Object.values(FunkoType), demandOption: true, describe: 'Type of the Funko' },
      genre: { choices: Object.values(FunkoGenre), demandOption: true, describe: 'Genre of the Funko' },
      franchise: { type: 'string', demandOption: true, describe: 'Franchise the Funko belongs to' },
      number: { type: 'number', demandOption: true, describe: 'Number within the franchise' },
      exclusive: { type: 'boolean', demandOption: true, describe: 'Is the Funko exclusive?' },
      specialFeatures: { type: 'string', demandOption: true, default: 'None', describe: 'Special features (e.g., Glows in the dark)' },
      marketValue: { type: 'number', demandOption: true, describe: 'Current market value' },
    },
    handler: (argv) => {
      const funko: Funko = {
        id: argv.id,
        name: argv.name,
        description: argv.desc,
        type: argv.type as FunkoType,
        genre: argv.genre as FunkoGenre,
        franchise: argv.franchise,
        number: argv.number,
        exclusive: argv.exclusive,
        specialFeatures: argv.specialFeatures,
        marketValue: argv.marketValue,
      };
      const request: requestType = { type: 'add', user: argv.user, funko: funko };
      sendRequest(request);
    },
  })
  .command({
    command: 'update',
    describe: 'Update an existing Funko Pop in a user collection',
    builder: {
        user: { type: 'string', demandOption: true, describe: 'Username of the collection owner' },
        id: { type: 'number', demandOption: true, describe: 'ID of the Funko to update' },
        // Opciones para actualizar (todas opcionales)
        name: { type: 'string', describe: 'New name for the Funko' },
        desc: { type: 'string', describe: 'New description' },
        type: { choices: Object.values(FunkoType), describe: 'New type' },
        genre: { choices: Object.values(FunkoGenre), describe: 'New genre' },
        franchise: { type: 'string', describe: 'New franchise' },
        number: { type: 'number', describe: 'New number within the franchise' },
        exclusive: { type: 'boolean', describe: 'New exclusive status' },
        specialFeatures: { type: 'string', describe: 'New special features' },
        marketValue: { type: 'number', describe: 'New market value' },
    },
    handler: (argv) => {
      // Construimos un objeto parcial con lo que SÍ se proporcionó
      const potentialUpdate: Partial<Funko> & { id: number } = { id: argv.id };
      if (argv.name !== undefined) potentialUpdate.name = argv.name;
      if (argv.desc !== undefined) potentialUpdate.description = argv.desc;
      if (argv.type !== undefined) potentialUpdate.type = argv.type as FunkoType;
      if (argv.genre !== undefined) potentialUpdate.genre = argv.genre as FunkoGenre;
      if (argv.franchise !== undefined) potentialUpdate.franchise = argv.franchise;
      if (argv.number !== undefined) potentialUpdate.number = argv.number;
      if (argv.exclusive !== undefined) potentialUpdate.exclusive = argv.exclusive;
      if (argv.specialFeatures !== undefined) potentialUpdate.specialFeatures = argv.specialFeatures;
      if (argv.marketValue !== undefined) potentialUpdate.marketValue = argv.marketValue;

      const request: requestType = {
          type: 'update',
          user: argv.user,
          id: argv.id,
          // Enviamos un objeto 'funko' parcial con los campos a actualizar
          funko: potentialUpdate as Funko // Hacemos type assertion aquí, el servidor validará
       };

      // Asegurarse que al menos un campo para actualizar fue proporcionado además del id
      if (Object.keys(potentialUpdate).length <= 1) {
          console.error(chalk.red('Error: You must provide at least one property to update (e.g., --name, --marketValue).'));
          return; // No enviar petición si no hay nada que actualizar
      }


      console.log(chalk.yellow("Note: Sending partial update data. Server will merge with existing Funko."));
      sendRequest(request);
    },
  })
  .command({
    command: 'remove',
    describe: 'Remove a Funko Pop from a user collection',
    builder: {
      user: { type: 'string', demandOption: true, describe: 'Username of the collection owner' },
      id: { type: 'number', demandOption: true, describe: 'ID of the Funko to remove' },
    },
    handler: (argv) => {
      const request: requestType = { type: 'remove', user: argv.user, id: argv.id };
      sendRequest(request);
    },
  })
  .command({
    command: 'list',
    describe: 'List all Funkos in a user collection',
    builder: {
      user: { type: 'string', demandOption: true, describe: 'Username of the collection owner' },
    },
    handler: (argv) => {
      const request: requestType = { type: 'list', user: argv.user };
      sendRequest(request);
    },
  })
  .command({
    command: 'read',
    describe: 'Show details of a specific Funko in a user collection',
    builder: {
      user: { type: 'string', demandOption: true, describe: 'Username of the collection owner' },
      id: { type: 'number', demandOption: true, describe: 'ID of the Funko to read' },
    },
    handler: (argv) => {
      const request: requestType = { type: 'read', user: argv.user, id: argv.id };
      sendRequest(request);
    },
  })
  .demandCommand(1, chalk.red('You need to provide a command (add, update, remove, list, read).'))
  .help()
  .alias('h', 'help')
  .strict() // Muestra error si se pasan opciones no definidas
  .parse(); // Ejecuta Yargs