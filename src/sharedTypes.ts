import { Funko } from "./funko.js";

/**
 * Comandos válidos que un cliente puede enviar al servidor.
 */
export type requestCommand = 'add' | 'update' | 'remove' | 'read' | 'list';

/**
 * Estructura de una solicitud enviada por el cliente al servidor.
 */
export type requestType = {
  type: requestCommand;
  user: string;
  id?: number;
  funko?: Funko;
}

/**
 * Estructura de una respuesta enviada por el servidor.
 */
export type responseType = {
  type: requestCommand;
  success: boolean;
  funkos?: Funko[];
  message?: string;
}