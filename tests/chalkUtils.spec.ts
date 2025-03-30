import { describe, test, expect } from "vitest";
import chalk from "chalk";
import { getMarketValueColor } from "../src/chalkUtils";

describe("getMarketValueColor", () => {
  test("debe devolver 'chalk.red' para valores menores a 20", () => {
    const color = getMarketValueColor(10);
    expect(color).toBe(chalk.red);
  });

  test("debe devolver 'chalk.yellow' para valores entre 20 y 49", () => {
    const color = getMarketValueColor(30);
    expect(color).toBe(chalk.yellow);
  });

  test("debe devolver 'chalk.blue' para valores entre 50 y 99", () => {
    const color = getMarketValueColor(75);
    expect(color).toBe(chalk.blue);
  });

  test("debe devolver 'chalk.green' para valores de 100 o mayores", () => {
    const color = getMarketValueColor(150);
    expect(color).toBe(chalk.green);
  });
});