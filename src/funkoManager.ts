import fs from "fs";
import path from "path";
import { Funko } from "./funko.js";

const dataDir = path.join(process.cwd(), "data");

/**
 * Obtiene el directorio de datos de un usuario.
 *
 * @param user - Nombre del usuario.
 * @returns La ruta del directorio del usuario.
 */
export function getUserDir(user: string): string {
  const dir = path.join(dataDir, user);
  return dir;
}

/**
 * Asegura que el directorio de un usuario exista. Si no existe, lo crea.
 *
 * @param user - Nombre del usuario.
 */
function ensureUserDir(user: string): void {
  const dir = getUserDir(user);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Guarda un Funko en el sistema de archivos.
 *
 * @param user - Nombre del usuario.
 * @param funko - Objeto Funko a guardar.
 * @returns `true` si el Funko se guardó correctamente, `false` si ya existía.
 */
export function saveFunko(user: string, funko: Funko): boolean {
  ensureUserDir(user);
  const filePath = path.join(getUserDir(user), `${funko.id}.json`);

  if (fs.existsSync(filePath)) {
    return false;
  }

  fs.writeFileSync(filePath, JSON.stringify(funko));
  return true;
}

/**
 * Actualiza un Funko existente en el sistema de archivos.
 *
 * @param user - Nombre del usuario.
 * @param funko - Objeto Funko con los datos actualizados.
 * @returns `true` si el Funko se actualizó correctamente, `false` si no existía.
 */
export function updateFunko(user: string, funko: Funko): boolean {
  const filePath = path.join(getUserDir(user), `${funko.id}.json`);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.writeFileSync(filePath, JSON.stringify(funko));
  return true;
}

/**
 * Elimina un Funko del sistema de archivos.
 *
 * @param user - Nombre del usuario.
 * @param id - Identificador del Funko a eliminar.
 * @returns `true` si el Funko se eliminó correctamente, `false` si no existía.
 */
export function deleteFunko(user: string, id: number): boolean {
  const filePath = path.join(getUserDir(user), `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return false;
  }

  fs.unlinkSync(filePath);
  return true;
}

/**
 * Lee un Funko del sistema de archivos.
 *
 * @param user - Nombre del usuario.
 * @param id - Identificador del Funko a leer.
 * @returns El objeto Funko si existe, o `null` si no se encuentra.
 */
export function readFunko(user: string, id: number): Funko | null {
  const filePath = path.join(getUserDir(user), `${id}.json`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const data = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(data);
}

/**
 * Lista todos los Funkos de un usuario.
 *
 * @param user - Nombre del usuario.
 * @returns Un arreglo de objetos Funko ordenados por ID.
 */
export function listFunkos(user: string): Funko[] {
  const dir = getUserDir(user);

  if (!fs.existsSync(dir)) {
    return [];
  }

  const files = fs.readdirSync(dir);
  return files
    .map((file) => {
      const data = fs.readFileSync(path.join(dir, file), "utf-8");
      return JSON.parse(data);
    })
    .sort((a, b) => a.id - b.id);
}