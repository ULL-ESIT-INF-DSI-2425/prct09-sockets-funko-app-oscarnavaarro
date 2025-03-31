import net from "net";
import chalk from "chalk";
import { requestType, responseType } from "./sharedTypes.js";
import { Funko } from "./funko.js";
import {
  saveFunko,
  updateFunko,
  deleteFunko,
  readFunko,
  listFunkos,
} from "./funkoManager.js";

const PORT = 60300;

console.log(chalk.blue("Starting Funko App Server..."));

const server = net.createServer((socket) => {
  console.log(chalk.green("Client connected."));

  let receivedData = "";

  // Evento cuando se reciben los datos del cliente
  socket.on("data", (chunk) => {
    receivedData = chunk.toString();
    console.log(
      chalk.yellow(`Received chunk: ${chunk.toString().substring(0, 50)}...`),
    );
  });

  // Evento cuando el cliente termina de enviar datos (ha llamado a socket.end())
  socket.on("end", () => {
    console.log(
      chalk.yellow("Client finished sending data. Processing request..."),
    );
    try {
      const request: requestType = JSON.parse(receivedData);
      console.log(
        chalk.blue(
          `Processing command: ${request.type} for user ${request.user}`,
        ),
      );

      let response: responseType;

      // Procesar la petición usando funkoManager
      switch (request.type) {
        case "add":
          if (!request.funko) {
            response = {
              type: request.type,
              success: false,
              message: "Error: Funko data missing in add request.",
            };
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

        case "update":
          // Recibimos un ID y un objeto 'funko' parcial con los campos a actualizar
          if (request.id === undefined || !request.funko) {
            response = {
              type: request.type,
              success: false,
              message:
                "Error: Funko ID and/or update data missing in update request.",
            };
          } else {
            const existingFunko = readFunko(request.user, request.id);

            if (!existingFunko) {
              response = {
                type: request.type,
                success: false,
                message: `Error: Funko with ID ${request.id} not found for user ${request.user}. Cannot update.`,
              };
            } else {
              const updatedFunkoData: Funko = {
                ...existingFunko, // Copia todos los campos del existente
                ...request.funko, // Sobrescribe con los campos del request (que vienen parciales)
                id: request.id, // Asegura que el ID no cambie accidentalmente
              };

              const updated = updateFunko(request.user, updatedFunkoData);
              response = {
                type: request.type,
                success: updated,
                message: updated
                  ? `Funko with ID ${request.id} updated for ${request.user}.`
                  : `Error: Could not update Funko with ID ${request.id} for ${request.user}.`,
              };
            }
          }
          break;

        case "remove":
          if (request.id === undefined) {
            response = {
              type: request.type,
              success: false,
              message: "Error: Funko ID missing in remove request.",
            };
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

        case "read":
          if (request.id === undefined) {
            response = {
              type: request.type,
              success: false,
              message: "Error: Funko ID missing in read request.",
            };
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

        case "list":
          const funkos = listFunkos(request.user);
          response = {
            type: request.type,
            success: true, // Listar siempre es "exitoso", puede devolver lista vacía
            funkos: funkos,
            message:
              funkos.length > 0
                ? `${funkos.length} Funkos listed for ${request.user}.`
                : `No Funkos found for ${request.user}.`,
          };
          break;

        default:
          response = {
            type: request.type,
            success: false,
            message: `Error: Unknown command type received.`,
          };
          break;
      }
      // Enviar respuesta al cliente
      const responseJson = JSON.stringify(response);
      console.log(
        chalk.blue(`Sending response: ${responseJson.substring(0, 100)}...`),
      );
      // Escribir la respuesta y LUEGO cerrar la conexión desde el servidor
      // Usar el callback de write para asegurar que se envió antes de cerrar.
      socket.write(responseJson, (err) => {
        if (err) {
          console.error(chalk.red("Error writing response to client:"), err);
        } else {
          console.log(chalk.cyan("Response sent successfully."));
        }
        // Cerramos la conexión después de enviar la respuesta.
        socket.end();
        console.log(chalk.magenta("Connection closed by server."));
      });
    } catch (error) {
      console.error(chalk.red("Error processing request:"), error);
      const errorResponse: responseType = {
        type: "add",
        success: false,
        message: `Server error processing request: ${error instanceof Error ? error.message : "Invalid JSON received"}`,
      };
      try {
        socket.write(JSON.stringify(errorResponse), (err) => {
          if (err)
            console.error(chalk.red("Error writing error response:"), err);
          socket.end(); // Cierra incluso si hay error al escribir
        });
      } catch (writeError) {
        console.error(
          chalk.red("Fatal error writing error response:"),
          writeError,
        );
        socket.destroy(); // Forzar cierre si falla la escritura
      }
    }
  });

  // Evento si ocurre un error en el socket
  socket.on("error", (err) => {
    console.error(chalk.red("Socket error:"), err);
  });

  // Evento cuando la conexión se cierra (por cliente o servidor)
  socket.on("close", (hadError) => {
    console.log(
      chalk.yellow(
        `Client disconnected ${hadError ? "due to error" : "gracefully"}.`,
      ),
    );
  });
});

// Manejo de errores del servidor (ej. puerto ocupado)
server.on("error", (err) => {
  console.error(chalk.red("Server error:"), err);
});

// Empezar a escuchar en el puerto especificado
server.listen(PORT, () => {
  console.log(chalk.green(`Server listening on port ${PORT}`));
});
