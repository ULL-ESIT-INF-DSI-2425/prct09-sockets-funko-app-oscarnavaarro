import { Funko } from "./funko.js";

export type requestCommand = 'add' | 'update' | 'remove' | 'read' | 'list';

export type requestType = {
  type: requestCommand;
  user: string;
  id?: number;
  funko?: Funko;
}

export type responseType = {
  type: requestCommand;
  success: boolean;
  funkos?: Funko[];
  message?: string;
}