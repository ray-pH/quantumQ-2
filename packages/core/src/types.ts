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
export type Circuit = readonly (readonly Gate[])[];

export const ALL_GATES = Object.values(Gate);
export const COLUMN_COUNT = 12;

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
  input: CircuitInput;
  goal: Goal | null;
  gates: readonly Gate[];
  locked: readonly (readonly [row: number, column: number, gate: Gate])[];
}>;
