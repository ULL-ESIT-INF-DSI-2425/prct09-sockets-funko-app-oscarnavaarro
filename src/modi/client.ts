import net from "net";
import readline from "readline";

interface ChatMessage {
  type: "message" | "system" | "welcome" | "user_join" | "user_leave" | "error";
  sender?: string;
  targetId?: string;
  content: string;
}

const client = new net.Socket();
let clientId: string | null = null;
let receiveBuffer: string = "";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: "> ",
});

function displayMessage(message: ChatMessage) {
  let output = "";

  switch (message.type) {
    case "welcome":
      output = `[SYSTEM]: ${message.content}`;
      if (message.targetId) {
        clientId = message.targetId;
      }
      break;
    case "message":
      output = `[${message.sender || "??"}]: ${message.content}`;
      break;
    case "system":
    case "user_join":
    case "user_leave":
    case "error":
      output = `[SERVER]: ${message.content}`;
      break;
    default:
      output = `[?]: ${message.content}`;
      break;
  }

  console.log(output);
  rl.prompt(true);
}

client.connect(60300, () => {
  console.log("[CLIENT] Conectado al servidor de chat.");
});

client.on("data", (dataChunk: Buffer) => {
  receiveBuffer += dataChunk.toString();

  let boundaryIndex;
  while ((boundaryIndex = receiveBuffer.indexOf("\n")) !== -1) {
    const jsonString = receiveBuffer.substring(0, boundaryIndex);
    receiveBuffer = receiveBuffer.substring(boundaryIndex + 1);

    if (jsonString) {
      try {
        const message: ChatMessage = JSON.parse(jsonString);
        displayMessage(message);
      } catch (error) {
        console.error(
          "\n[CLIENT] Error: Mensaje JSON inválido recibido del servidor:",
          jsonString,
          error,
        );
        rl.prompt(true);
      }
    }
  }
});

client.on("close", () => {
  console.log("[CLIENT] Conexión cerrada por el servidor.");
  rl.close();
});

rl.on("line", (input) => {
  const line = input.trim();
  if (line) {
    const message: Partial<ChatMessage> = {
      type: "message",
      content: line,
    };
    
    try {
      const jsonString = JSON.stringify(message);
      client.write(jsonString + "\n");
    } catch (error) {
      console.error("[CLIENT] Error al crear mensaje JSON:", error);
    }
  }
  rl.prompt(true);
});

rl.on("close", () => {
  console.log("\n[CLIENT] Desconectando...");
  client.end();
});
