import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import chalk from "chalk";
import { Funko, FunkoType, FunkoGenre } from "./funko.js";
import {
  saveFunko,
  updateFunko,
  deleteFunko,
  readFunko,
  listFunkos,
} from "./funkoManager.js";
import { getMarketValueColor } from "./chalkUtils.js";

/**
 * Configuración de la CLI para gestionar una colección de Funkos.
 */
yargs(hideBin(process.argv))
  /**
   * Comando para agregar un nuevo Funko a la colección de un usuario.
   */
  .command({
    command: "add",
    describe: "Add a new Funko Pop",
    builder: {
      user: { type: "string", demandOption: true },
      id: { type: "number", demandOption: true },
      name: { type: "string", demandOption: true },
      desc: { type: "string", demandOption: true },
      type: { choices: Object.values(FunkoType), demandOption: true },
      genre: { choices: Object.values(FunkoGenre), demandOption: true },
      franchise: { type: "string", demandOption: true },
      number: { type: "number", demandOption: true },
      exclusive: { type: "boolean", demandOption: true },
      specialFeatures: { type: "string", demandOption: true },
      marketValue: { type: "number", demandOption: true },
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

      const success = saveFunko(argv.user as string, funko);
      console.log(
        success
          ? chalk.green(`New Funko added to ${argv.user} collection!`)
          : chalk.red(`Funko already exists in ${argv.user} collection!`),
      );
    },
  })
  /**
   * Comando para actualizar un Funko existente en la colección de un usuario.
   */
  .command({
    command: "update",
    describe: "Update an existing Funko Pop",
    builder: {
      user: { type: "string", demandOption: true },
      id: { type: "number", demandOption: true },
      name: { type: "string" },
      desc: { type: "string" },
      type: { choices: Object.values(FunkoType) },
      genre: { choices: Object.values(FunkoGenre) },
      franchise: { type: "string" },
      number: { type: "number" },
      exclusive: { type: "boolean" },
      specialFeatures: { type: "string" },
      marketValue: { type: "number" },
    },
    handler: (argv) => {
      const existing = readFunko(argv.user as string, argv.id);
      if (!existing) {
        console.log(chalk.red(`Funko not found in ${argv.user} collection!`));
        return;
      }

      const updated: Funko = {
        id: argv.id,
        name: argv.name ?? existing.name,
        description: argv.desc ?? existing.description,
        type: (argv.type as FunkoType) ?? existing.type,
        genre: (argv.genre as FunkoGenre) ?? existing.genre,
        franchise: argv.franchise ?? existing.franchise,
        number: argv.number ?? existing.number,
        exclusive: argv.exclusive ?? existing.exclusive,
        specialFeatures: argv.specialFeatures ?? existing.specialFeatures,
        marketValue: argv.marketValue ?? existing.marketValue,
      };

      const success = updateFunko(argv.user as string, updated);
      console.log(
        success
          ? chalk.green(`Funko updated in ${argv.user} collection!`)
          : chalk.red(`Error updating Funko in ${argv.user} collection!`),
      );
    },
  })
  /**
   * Comando para eliminar un Funko de la colección de un usuario.
   */
  .command({
    command: "remove",
    describe: "Remove a Funko Pop",
    builder: {
      user: { type: "string", demandOption: true },
      id: { type: "number", demandOption: true },
    },
    handler: (argv) => {
      const success = deleteFunko(argv.user as string, argv.id);
      console.log(
        success
          ? chalk.green(`Funko removed from ${argv.user} collection!`)
          : chalk.red(`Funko not found in ${argv.user} collection!`),
      );
    },
  })
  /**
   * Comando para listar todos los Funkos en la colección.
   */
  .command({
    command: "list",
    describe: "List all Funkos in collection",
    builder: {
      user: { type: "string", demandOption: true },
    },
    handler: (argv) => {
      const funkos = listFunkos(argv.user as string);
      if (funkos.length === 0) {
        console.log(chalk.red(`${argv.user} has no Funko collection.`));
        return;
      }

      console.log(chalk.blue(`${argv.user}'s Funko Collection`));
      console.log("--------------------------------");
      funkos.forEach((funko) => {
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
        console.log(`Market Value: ${valueColor(funko.marketValue)}`);
        console.log("--------------------------------");
      });
    },
  })
  /**
   * Comando para mostrar los detalles de un Funko específico.
   */
  .command({
    command: "read",
    describe: "Show details of a specific Funko",
    builder: {
      user: { type: "string", demandOption: true },
      id: { type: "number", demandOption: true },
    },
    handler: (argv) => {
      const funko = readFunko(argv.user as string, argv.id);
      if (!funko) {
        console.log(chalk.red(`Funko not found in ${argv.user} collection!`));
        return;
      }

      const valueColor = getMarketValueColor(funko.marketValue);
      console.log(chalk.blue(`Funko Details (ID: ${funko.id})`));
      console.log("--------------------------------");
      console.log(`Name: ${funko.name}`);
      console.log(`Description: ${funko.description}`);
      console.log(`Type: ${funko.type}`);
      console.log(`Genre: ${funko.genre}`);
      console.log(`Franchise: ${funko.franchise}`);
      console.log(`Number: ${funko.number}`);
      console.log(`Exclusive: ${funko.exclusive ? "Yes" : "No"}`);
      console.log(`Special Features: ${funko.specialFeatures}`);
      console.log(`Market Value: ${valueColor(funko.marketValue)}`);
      console.log("--------------------------------");
    },
  })
  /**
   * Obliga a que se proporcione al menos un comando.
   */
  .demandCommand(1, "You need at least one command")
  .parse();