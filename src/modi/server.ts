import net from "net";

interface ChatMessage {
  type: "message" | "system" | "welcome" | "user_join" | "user_leave" | "error";
  sender?: string;
  targetId?: string;
  content: string;
}

const clients = new Map<string, { socket: net.Socket; buffer: string }>();
let clientIdCounter = 0;

function sendJson(socket: net.Socket, message: ChatMessage) {
  try {
    const jsonString = JSON.stringify(message);
    socket.write(jsonString + "\n");
  } catch (error) {
    console.error(
      `[SERVER] Error al serializar JSON para ${socket.remoteAddress}:`,
      error,
    );
  }
}

function broadcastJson(message: ChatMessage, senderSocket?: net.Socket) {
  clients.forEach((clientInfo) => {
    if (clientInfo.socket !== senderSocket) {
      sendJson(clientInfo.socket, message);
    }
  });
}

const server = net.createServer((socket: net.Socket) => {
  const clientId = `user-${++clientIdCounter}`;
  clients.set(clientId, { socket, buffer: "" });
  console.log(`[SERVER] Nuevo cliente conectado: ${clientId}`);

  const welcomeMsg: ChatMessage = {
    type: "welcome",
    content: `¡Bienvenido al chat! Tu ID es: ${clientId}`,
    targetId: clientId,
  };
  sendJson(socket, welcomeMsg);

  const joinMsg: ChatMessage = {
    type: "user_join",
    targetId: clientId,
    content: `${clientId} se ha unido al chat.`,
  };
  broadcastJson(joinMsg, socket);

  socket.on("data", (dataChunk: Buffer) => {
    const clientInfo = clients.get(clientId);
    if (!clientInfo) return;

    clientInfo.buffer += dataChunk.toString();

    let boundaryIndex;
    while ((boundaryIndex = clientInfo.buffer.indexOf("\n")) !== -1) {
      const jsonString = clientInfo.buffer.substring(0, boundaryIndex);
      clientInfo.buffer = clientInfo.buffer.substring(boundaryIndex + 1);

      if (jsonString) {
        try {
          const message: ChatMessage = JSON.parse(jsonString);

          if (
            typeof message === "object" &&
            message !== null &&
            message.type &&
            message.content
          ) {
            console.log(`[${clientId} - RAW JSON]: ${jsonString}`);

            const broadcastMsg: ChatMessage = {
              ...message,
              sender: clientId,
            };

            if (broadcastMsg.type === "message") {
              console.log(`[${clientId} - Parsed]: ${broadcastMsg.content}`);
              broadcastJson(broadcastMsg, socket);
            } else {
              console.log(
                `[${clientId} - Ignored Type]: Ignorando mensaje tipo '${message.type}' del cliente.`,
              );
            }
          } else {
            console.warn(
              `[${clientId} - Invalid Format]: Mensaje JSON con formato inválido: ${jsonString}`,
            );
            sendJson(socket, {
              type: "error",
              content: "Formato de mensaje inválido.",
            });
          }
        } catch (error) {
          console.error(
            `[${clientId} - JSON Parse Error]: Error al parsear JSON: ${jsonString}`,
            error,
          );
          sendJson(socket, {
            type: "error",
            content: "Mensaje JSON mal formado.",
          });
        }
      }
    }
  });

  const handleDisconnect = (reason: string) => {
    if (clients.has(clientId)) {
      console.log(`[SERVER] Cliente ${clientId} ${reason}.`);
      const leaveMsg: ChatMessage = {
        type: "user_leave",
        targetId: clientId,
        content: `${clientId} ${reason}.`,
      };
      clients.delete(clientId);
      broadcastJson(leaveMsg, socket);
    }
  };

  socket.on("end", () => handleDisconnect("se ha desconectado"));
});

server.listen(60300, () => {
  console.log(`[SERVER] Servidor de chat escuchando en 60300`);
});

server.on("error", (err) => {
  console.error("[SERVER] Error del servidor:", err);
  process.exit(1);
});
