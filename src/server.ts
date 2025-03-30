import net from 'net';
import chalk from 'chalk';
import { requestType, responseType, requestCommand } from './sharedTypes.js';
import { Funko } from './funko.js';
import {
  saveFunko,
  updateFunko,
  deleteFunko,
  readFunko,
  listFunkos,
} from './funkoManager.js'; // Importa las funciones síncronas

const PORT = 60300;

console.log(chalk.blue('Starting Funko App Server...'));

const server = net.createServer((socket) => {
  console.log(chalk.green('Client connected.'));

  let receivedData = '';

  socket.on('data', (chunk) => {
    receivedData = chunk.toString();
    console.log(chalk.yellow(`Received chunk: ${chunk.toString().substring(0, 50)}...`));
  });

  socket.on('end', () => {
    console.log(chalk.yellow('Client finished sending data. Processing request...'));
    try {
      const request: requestType = JSON.parse(receivedData);
      console.log(chalk.blue(`Processing command: ${request.type} for user ${request.user}`));

      let response: responseType;

      switch (request.type) {
        case 'add':
          if (!request.funko) {
            response = { type: request.type, success: false, message: 'Error: Funko data missing in add request.' };
          } else {
            const added = saveFunko(request.user, request.funko);
            response = {
              type: request.type,
              success: added,
              message: added
                ? `Funko with ID ${request.funko.id} added to ${request.user} collection.`
                : `Error: Funko with ID ${request.funko.id} already exists for ${request.user} or error saving.`,
            };
          }
          break;
        
          case 'update':
            // Recibimos un ID y un objeto 'funko' parcial con los campos a actualizar
            if (request.id === undefined || !request.funko) {
              response = { type: request.type, success: false, message: 'Error: Funko ID and/or update data missing in update request.' };
            } else {
              // 1. Leer el Funko existente
              const existingFunko = readFunko(request.user, request.id);

              if (!existingFunko) {
                // No se encontró el Funko a actualizar
                response = {
                  type: request.type,
                  success: false,
                  message: `Error: Funko with ID ${request.id} not found for user ${request.user}. Cannot update.`,
                };
              } else {
                // 2. Crear el objeto actualizado fusionando el existente con los datos recibidos
                //    Object.assign(target, ...sources) modifica target
                const updatedFunkoData: Funko = {
                    ...existingFunko, // Copia todos los campos del existente
                    ...request.funko, // Sobrescribe con los campos del request (que vienen parciales)
                    id: request.id    // Asegura que el ID no cambie accidentalmente
                };

                // 3. Intentar guardar el Funko actualizado
                const updated = updateFunko(request.user, updatedFunkoData);
                response = {
                  type: request.type,
                  success: updated,
                  message: updated
                    ? `Funko with ID ${request.id} updated for ${request.user}.`
                    : `Error: Could not update Funko with ID ${request.id} for ${request.user}.`, // Mensaje de error genérico de updateFunko
                };
              }
            }
            break;

        case 'remove':
          if (request.id === undefined) {
            response = { type: request.type, success: false, message: 'Error: Funko ID missing in remove request.' };
          } else {
            const removed = deleteFunko(request.user, request.id);
            response = {
              type: request.type,
              success: removed,
              message: removed
              ? `Funko with ID ${request.id} removed from ${request.user} collection.`
              : `Error: Funko with ID ${request.id} not found for ${request.user} or error removing.`,
            };
          }
          break;
        
        case 'read':
          if (request.id === undefined) {
            response = { type: request.type, success: false, message: 'Error: Funko ID missing in read request.' };
          } else {
            const funko = readFunko(request.user, request.id);
            response = {
              type: request.type,
              success: !!funko, // true si funko no es null
              funkos: funko ? [funko] : [], // Devuelve el funko en un array si se encontró
              message: funko
                ? `Funko with ID ${request.id} found.`
                : `Error: Funko with ID ${request.id} not found for ${request.user}.`,
            };
          }
          break;

        case 'list':
          const funkos = listFunkos(request.user);
          response = {
            type: request.type,
            success: true, // Listar siempre es "exitoso", puede devolver lista vacía
            funkos: funkos,
            message: funkos.length > 0
            ? `${funkos.length} Funkos listed for ${request.user}.`
            : `No Funkos found for ${request.user}.`,
          };
          break;

        default:
          response = { type: request.type, success: false, message: `Error: Unknown command type received.` };
          break;
      }
      // Enviar respuesta al cliente
      const responseJson = JSON.stringify(response);
      console.log(chalk.blue(`Sending response: ${responseJson.substring(0, 100)}...`));

      socket.write(responseJson, (err) => {
        if (err) {
          console.error(chalk.red('Error writing response to client:'), err);
        } else {
          console.log(chalk.cyan('Response sent successfully.'));
        }
      socket.end();
      console.log(chalk.magenta('Connection closed by server.'));        
      });

    } catch (error) {
      console.error(chalk.red('Error processing request:'), error);
      const errorResponse: responseType = {
        type: 'add',
        success: false,
        message: `Server error processing request: ${error instanceof Error ? error.message : 'Invalid JSON received'}`,
      };
      try {
        socket.write(JSON.stringify(errorResponse), (err) => {
          if (err) console.error(chalk.red('Error writing error response:'), err);
          socket.end(); // Cierra incluso si hay error al escribir
        });
      } catch (writeError) {
        console.error(chalk.red('Fatal error writing error response:'), writeError);
        socket.destroy(); // Forzar cierre si falla la escritura
      }
    }
  });

  socket.on('error', (err) => {
    console.error(chalk.red('Socket error:'), err);
  })

  socket.on('close', (hadError) => {
    console.log(chalk.yellow(`Client disconnected ${hadError ? 'due to error' : 'gracefully'}.`));
  });
});

server.on('error', (err) => {
  console.error(chalk.red('Server error:'), err);
});

// Empezar a escuchar en el puerto especificado
server.listen(PORT, () => {
  console.log(chalk.green(`Server listening on port ${PORT}`));
});