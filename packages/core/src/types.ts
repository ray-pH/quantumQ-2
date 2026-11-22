export const Gate = {
  Empty: "empty",
  H: "h",
  X: "x",
  Y: "y",
  Z: "z",
  Ctrl: "control",
  S: "s",
} as const;

export type Gate = (typeof Gate)[keyof typeof Gate];
export type Bit = 0 | 1;
export type Complex = readonly [real: number, imaginary: number];
export type Matrix = readonly [
  readonly [Complex, Complex],
  readonly [Complex, Complex],
];
export type Circuit = readonly (readonly string[])[];

export const ALL_GATES = Object.values(Gate);
export const COLUMN_COUNT = 12;
export const MAX_QUBITS = 4;

export type CircuitInput =
  | Readonly<{ kind: "basis"; bits: readonly Bit[] }>
  | Readonly<{ kind: "state"; qubits: number; amplitudes: readonly Complex[] }>;

export type Goal = Readonly<{
  kind: "probability" | "amplitude";
  amplitudes: readonly Complex[];
}>;

export type Level = Readonly<{
  id: number;
  description: string;
  task: string;
  help?: readonly string[];
  unlockAfter?: readonly number[];
  input: CircuitInput;
  goal: Goal | null;
  gates: readonly string[];
  locked: readonly (readonly [row: number, column: number, gate: string])[];
}>;
