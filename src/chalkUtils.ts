import chalk, { ChalkInstance } from "chalk";

/**
 * Devuelve un color de texto de acuerdo con el valor de mercado proporcionado.
 *
 * @param value - El valor de mercado del Funko.
 * @returns Una instancia de `ChalkInstance` que representa el color correspondiente:
 * - `red` si el valor es menor a 20.
 * - `yellow` si el valor está entre 20 y 49.
 * - `blue` si el valor está entre 50 y 99.
 * - `green` si el valor es 100 o mayor.
 */
export function getMarketValueColor(value: number): ChalkInstance {
  if (value < 20) return chalk.red;
  if (value < 50) return chalk.yellow;
  if (value < 100) return chalk.blue;
  return chalk.green;
}