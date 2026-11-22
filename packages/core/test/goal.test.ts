import { describe, expect, it } from "vitest";
import { goalSchema } from "../src/goal.ts";

describe("goal amplitude expressions", () => {
  it.each([
    ["1 / sqrt(2)", 1 / Math.sqrt(2)],
    ["sqrt(0.3 + 0.7) / (2 * 2)", 0.25],
    ["1 - 2 * 3 + 4 / 2", -3],
    ["2 ^ 3 ^ 2", 512],
    ["-2^2", -4],
    ["(-2)^2", 4],
    ["2^-2", 0.25],
    ["+.5 + 5e-1", 1],
  ])(
    "evaluates %s in real and imaginary coefficients",
    (expression, expected) => {
      const goal = goalSchema.parse({
        kind: "amplitude",
        amplitudes: [expression, [0, expression]],
      });
      expect(goal?.amplitudes).toEqual([
        [expected, 0],
        [0, expected],
      ]);
    },
  );

  it.each([
    "1 / 0",
    "sqrt(-1)^0",
    "2^1024",
    "sqrt(2",
    "2(3)",
    "1 2",
    "Math.sqrt(2)",
    "2; 3",
    "1+".repeat(65) + "1",
  ])("rejects invalid or non-finite input %s", (expression) => {
    expect(
      goalSchema.safeParse({
        kind: "amplitude",
        amplitudes: [0, [expression, 0]],
      }).success,
    ).toBe(false);
  });
});
