import { describe, test, expect, beforeEach, afterEach } from "vitest";
import fs from "fs";
import path from "path";
import {
  getUserDir,
  saveFunko,
  updateFunko,
  deleteFunko,
  readFunko,
  listFunkos,
} from "../src/funkoManager";
import { Funko, FunkoType, FunkoGenre } from "../src/funko";

const testUser = "testUser";
const testDir = path.join(process.cwd(), "data", testUser);

const testFunko: Funko = new Funko(
  1,
  "Spider-Man",
  "A Spider-Man Funko Pop",
  FunkoType.Pop,
  FunkoGenre.MoviesTV,
  "Marvel",
  123,
  true,
  "Glow in the dark",
  29.99
);

beforeEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

afterEach(() => {
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
});

describe("Funko Manager", () => {
  test("debe crear el directorio de usuario correcto", () => {
    const dir = getUserDir(testUser);
    expect(dir).toBe(testDir);
  });

  test("debe guardar un Funko correctamente", () => {
    const result = saveFunko(testUser, testFunko);
    expect(result).toBe(true);
    expect(fs.existsSync(path.join(testDir, `${testFunko.id}.json`))).toBe(true);
  });

  test("no debe guardar un Funko si ya existe", () => {
    saveFunko(testUser, testFunko);
    const result = saveFunko(testUser, testFunko);
    expect(result).toBe(false);
  });

  test("debe actualizar un Funko existente", () => {
    saveFunko(testUser, testFunko);
    const updatedFunko = { ...testFunko, name: "Updated Spider-Man" };
    const result = updateFunko(testUser, updatedFunko);
    expect(result).toBe(true);

    const updatedData = readFunko(testUser, testFunko.id);
    expect(updatedData?.name).toBe("Updated Spider-Man");
  });

  test("no debe actualizar un Funko si no existe", () => {
    const result = updateFunko(testUser, testFunko);
    expect(result).toBe(false);
  });

  test("debe borrar un Funko existente", () => {
    saveFunko(testUser, testFunko);
    const result = deleteFunko(testUser, testFunko.id);
    expect(result).toBe(true);
    expect(fs.existsSync(path.join(testDir, `${testFunko.id}.json`))).toBe(false);
  });

  test("no debe borrar un Funko si no existe", () => {
    const result = deleteFunko(testUser, testFunko.id);
    expect(result).toBe(false);
  });

  test("debe leer un Funko existente", () => {
    saveFunko(testUser, testFunko);
    const result = readFunko(testUser, testFunko.id);
    expect(result).toEqual(testFunko);
  });

  test("debe retornar null cuando lee un Funko no existente", () => {
    const result = readFunko(testUser, testFunko.id);
    expect(result).toBeNull();
  });

  test("debe listar todos los Funkos de un usuario", () => {
    const funko2 = { ...testFunko, id: 2, name: "Iron Man" };
    saveFunko(testUser, testFunko);
    saveFunko(testUser, funko2);

    const result = listFunkos(testUser);
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(1);
    expect(result[1].id).toBe(2);
  });

  test("debe retornar una lista vacía si el usuario no tiene Funkos", () => {
    const result = listFunkos(testUser);
    expect(result).toEqual([]);
  });
});