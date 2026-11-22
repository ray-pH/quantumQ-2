import { z } from "zod";
import { MAX_QUBITS } from "./types.ts";
import type { Complex } from "./types.ts";

const operators = new Map([
  [
    "+",
    { precedence: 1, apply: (left: number, right: number) => left + right },
  ],
  [
    "-",
    { precedence: 1, apply: (left: number, right: number) => left - right },
  ],
  [
    "*",
    { precedence: 2, apply: (left: number, right: number) => left * right },
  ],
  [
    "/",
    { precedence: 2, apply: (left: number, right: number) => left / right },
  ],
  [
    "^",
    { precedence: 3, apply: (left: number, right: number) => left ** right },
  ],
]);

function finite(value: number): number {
  if (!Number.isFinite(value)) {
    throw new Error("The expression must evaluate to a finite real number.");
  }
  return value;
}

function evaluateExpression(source: string): number {
  const tokens =
    source.match(/sqrt|(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?|\S/g) ?? [];
  let index = 0;

  function consume(expected: string) {
    if (tokens[index++] !== expected) {
      throw new Error(`Expected "${expected}" in the expression.`);
    }
  }

  function readOperand(): number {
    const token = tokens[index++];
    if (token === "+" || token === "-") {
      const value = readExpression(3);
      return token === "-" ? -value : value;
    }
    if (token === "(" || token === "sqrt") {
      if (token === "sqrt") consume("(");
      const value = readExpression(1);
      consume(")");
      return token === "sqrt" ? finite(Math.sqrt(value)) : value;
    }
    const value = Number(token);
    if (Number.isNaN(value)) {
      throw new Error("Expected a number, parentheses, or sqrt().");
    }
    return finite(value);
  }

  function readExpression(minPrecedence: number): number {
    let value = readOperand();
    let operator = operators.get(tokens[index]);
    while (operator && operator.precedence >= minPrecedence) {
      const rightAssociative = tokens[index++] === "^";
      const right = readExpression(
        operator.precedence + (rightAssociative ? 0 : 1),
      );
      value = finite(operator.apply(value, right));
      operator = operators.get(tokens[index]);
    }
    return value;
  }

  const value = readExpression(1);
  if (index !== tokens.length) {
    throw new Error(`Unexpected "${tokens[index]}" in the expression.`);
  }
  return value;
}

const coefficient = z.union([z.number(), z.string().trim().min(1).max(128)]);
const amplitude = z
  .union([coefficient, z.tuple([coefficient, coefficient])])
  .transform((value, context): Complex => {
    const pair = Array.isArray(value) ? value : ([value, 0] as const);
    const evaluate = (part: number | string) =>
      typeof part === "number" ? part : evaluateExpression(part);
    try {
      return [evaluate(pair[0]), evaluate(pair[1])];
    } catch (error) {
      context.addIssue({
        code: "custom",
        message: error instanceof Error ? error.message : "Invalid expression.",
      });
      return z.NEVER;
    }
  });

export const goalSchema = z
  .object({
    kind: z.enum(["probability", "amplitude"]),
    amplitudes: z
      .array(amplitude)
      .min(2)
      .max(2 ** MAX_QUBITS),
  })
  .nullable();
