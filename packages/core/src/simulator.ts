import { Gate } from "./types.ts";
import type { CustomGate } from "./level-pack.ts";
import type { Circuit, CircuitInput, Complex, Goal, Matrix } from "./types.ts";
type MatrixGate = Exclude<Gate, typeof Gate.Empty | typeof Gate.Ctrl>;

const h = Math.SQRT1_2;
const zero: Complex = [0, 0];
const one: Complex = [1, 0];

export const GATE_MATRICES: Readonly<Record<MatrixGate, Matrix>> = {
  [Gate.H]: [
    [
      [h, 0],
      [h, 0],
    ],
    [
      [h, 0],
      [-h, 0],
    ],
  ],
  [Gate.X]: [
    [zero, one],
    [one, zero],
  ],
  [Gate.Y]: [
    [zero, [0, -1]],
    [[0, 1], zero],
  ],
  [Gate.Z]: [
    [one, zero],
    [zero, [-1, 0]],
  ],
  [Gate.S]: [
    [one, zero],
    [zero, [0, 1]],
  ],
};

const GOAL_TOLERANCE = 0.0001;

export function qubitCount(input: CircuitInput): number {
  return input.kind === "basis" ? input.bits.length : input.qubits;
}

function initialState(input: CircuitInput): Complex[] {
  if (input.kind === "state") return [...input.amplitudes];

  const basis = input.bits.reduce<number>((index, bit) => index * 2 + bit, 0);
  return Array.from({ length: 2 ** input.bits.length }, (_, index) =>
    index === basis ? one : zero,
  );
}

function multiplyAndAdd(
  [ar, ai]: Complex,
  [br, bi]: Complex,
  [cr, ci]: Complex,
  [dr, di]: Complex,
): Complex {
  return [
    ar * br - ai * bi + cr * dr - ci * di,
    ar * bi + ai * br + cr * di + ci * dr,
  ];
}

export function probability([real, imaginary]: Complex): number {
  return real * real + imaginary * imaginary;
}

export function evaluateCircuit(
  circuit: Circuit,
  input: CircuitInput,
  customGates?: ReadonlyMap<string, CustomGate>,
): Complex[] {
  const state = initialState(input);
  const count = qubitCount(input);
  const columns = circuit[0]?.length ?? 0;

  if (
    state.length !== 2 ** count ||
    circuit.length !== count ||
    circuit.some((row) => row.length !== columns)
  ) {
    throw new RangeError("Circuit dimensions do not match the input state");
  }

  for (let column = 0; column < columns; column++) {
    // The top wire is the most significant bit, as in the Godot board.
    const controlMask = circuit.reduce(
      (mask, row, index) =>
        row[column] === Gate.Ctrl ? mask | (1 << (count - index - 1)) : mask,
      0,
    );

    for (let row = count - 1; row >= 0; row--) {
      const gate = circuit[row][column];
      if (gate === Gate.Empty || gate === Gate.Ctrl) continue;

      const targetBit = 1 << (count - row - 1);
      const matrix = Object.hasOwn(GATE_MATRICES, gate)
        ? GATE_MATRICES[gate as MatrixGate]
        : customGates?.get(gate)?.matrix;
      if (!matrix) throw new Error(`Unknown gate "${gate}"`);
      const [[m00, m01], [m10, m11]] = matrix;
      for (let index = 0; index < state.length; index++) {
        if (index & targetBit || (index & controlMask) !== controlMask)
          continue;

        const paired = index | targetBit;
        const a = state[index];
        const b = state[paired];
        state[index] = multiplyAndAdd(m00, a, m01, b);
        state[paired] = multiplyAndAdd(m10, a, m11, b);
      }
    }
  }

  return state;
}

export function isSolution(state: readonly Complex[], goal: Goal): boolean {
  return (
    state.length === goal.amplitudes.length &&
    state.every((amplitude, index) => {
      const expected = goal.amplitudes[index];
      if (goal.kind === "probability") {
        return (
          Math.abs(probability(amplitude) - probability(expected)) <
          GOAL_TOLERANCE
        );
      }
      return (
        Math.abs(amplitude[0] - expected[0]) < GOAL_TOLERANCE &&
        Math.abs(amplitude[1] - expected[1]) < GOAL_TOLERANCE
      );
    })
  );
}
