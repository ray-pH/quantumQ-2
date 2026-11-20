// Puzzle definitions ported from scripts/levels.gd in QuantumQ for Godot.
import { ALL_GATES, Gate } from "./types.ts";
import type { Bit, Complex, Level } from "./types.ts";

const complex = (re: number, im: number): Complex => [re, im];

type LegacyLevel = Readonly<{
  id: number;
  desc: string;
  task: string;
  input: readonly Bit[] | null;
  istate?: readonly Complex[];
  nQ?: number;
  prob: boolean;
  output: readonly Complex[];
  gates: readonly Gate[];
  locked: readonly (readonly [row: number, column: number, gate: Gate])[];
}>;

export const SECTIONS: Readonly<Partial<Record<number, string>>> = {
  0: "Introduction",
  4: "Control",
  7: "Superposition",
  11: "Entanglement",
  13: "Phase",
  20: "More Puzzle",
  101: "Sandbox",
  30: "",
};

const definitions: readonly LegacyLevel[] = [
  {
    id: 0,
    desc: "evaluate intro",
    task: "Press the [b]Evaluate[/b] button",
    input: [0],
    prob: true,
    output: [complex(1, 0), complex(0, 0)],
    gates: [Gate.Empty],
    locked: [],
  },
  {
    id: 1,
    desc: "X intro",
    task: "Turn the qubit into state [i]|0⟩[/i]",
    input: [1],
    prob: true,
    output: [complex(1, 0), complex(0, 0)],
    gates: [Gate.Empty, Gate.X],
    locked: [],
  },
  {
    id: 2,
    desc: "Multi-bits intro",
    task: "Create the state [i]|10⟩[/i]",
    input: [0, 1],
    prob: true,
    output: [complex(0, 0), complex(0, 0), complex(1, 0), complex(0, 0)],
    gates: [Gate.Empty, Gate.X],
    locked: [],
  },
  {
    id: 3,
    desc: "Multi-bits two",
    task: "Create the state [i]|111⟩[/i]",
    input: [0, 1, 0],
    prob: true,
    output: [
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(1, 0),
    ],
    gates: [Gate.Empty, Gate.X],
    locked: [],
  },
  {
    id: 4,
    desc: "Control intro",
    task:
      "Create the state [i]|00⟩[/i] by placing a control to a gate\n\n" +
      "Greyed out block mean it's locked and cannot be changed",
    input: [0, 0],
    prob: true,
    output: [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)],
    gates: [Gate.Empty, Gate.Ctrl],
    locked: [[1, 3, Gate.X]],
  },
  {
    id: 5,
    desc: "Control more",
    task: "Create the state [i]|00⟩[/i]",
    input: [0, 1],
    prob: true,
    output: [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)],
    gates: [Gate.Empty, Gate.X, Gate.Ctrl],
    locked: [
      [1, 0, Gate.Empty],
      [1, 1, Gate.Empty],
      [1, 2, Gate.Empty],
      [1, 4, Gate.Empty],
      [1, 5, Gate.Empty],
      [1, 6, Gate.Empty],
      [1, 7, Gate.Empty],
      [1, 8, Gate.Empty],
      [1, 9, Gate.Empty],
      [1, 10, Gate.Empty],
      [1, 11, Gate.Empty],
      [1, 3, Gate.X],
      [0, 3, Gate.Ctrl],
    ],
  },
  {
    id: 6,
    desc: "Even more control",
    task:
      "Create the state [i]|100⟩[/i]\n\n" +
      "*a gate can have more than one control nodes, and will active if " +
      "all the control qubits is [i]|1⟩[/i]",
    input: [0, 1, 0],
    prob: true,
    output: [
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(1, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
    ],
    gates: [Gate.Empty, Gate.X, Gate.Ctrl],
    locked: [
      [0, 0, Gate.Empty],
      [0, 1, Gate.Empty],
      [0, 2, Gate.Empty],
      [0, 3, Gate.Empty],
      [0, 5, Gate.Empty],
      [0, 6, Gate.Empty],
      [0, 7, Gate.Empty],
      [0, 8, Gate.Empty],
      [0, 9, Gate.Empty],
      [0, 10, Gate.Empty],
      [0, 11, Gate.Empty],
      [0, 4, Gate.X],
      [1, 4, Gate.Ctrl],
      [2, 4, Gate.Ctrl],
    ],
  },
  {
    id: 7,
    desc: "superposition intro",
    task: "Create a superposition of [i]|0⟩[/i] and [i]|1⟩[/i]",
    input: [0],
    prob: true,
    output: [complex(0.707107, 0), complex(0.707107, 0)],
    gates: [Gate.Empty, Gate.X, Gate.H],
    locked: [],
  },
  {
    id: 8,
    desc: "superposition all",
    task:
      "Create a superposition of all 2-bits basis states.\n\n" +
      "All 2-bits basis states are ([i]|00⟩, |01⟩, |10⟩, |11⟩[/i])",
    input: [0, 0],
    prob: true,
    output: [
      complex(0.5, 0),
      complex(0.5, 0),
      complex(0.5, 0),
      complex(0.5, 0),
    ],
    gates: [Gate.Empty, Gate.X, Gate.H],
    locked: [],
  },
  {
    id: 9,
    desc: "superposition",
    task: "Create a superposition of [i]|01⟩[/i] and [i]|11⟩[/i]",
    input: [0, 0],
    prob: true,
    output: [
      complex(0, 0),
      complex(0.707107, 0),
      complex(0, 0),
      complex(0.707107, 0),
    ],
    gates: [Gate.Empty, Gate.X, Gate.H],
    locked: [],
  },
  {
    id: 10,
    desc: "superposition of more bits",
    task: "Create a superposition of [i]|001⟩[/i] and [i]|011⟩[/i]",
    input: [1, 0, 1],
    prob: true,
    output: [
      complex(0, 0),
      complex(0.707107, 0),
      complex(0, 0),
      complex(0.707107, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
    ],
    gates: [Gate.Empty, Gate.X, Gate.H],
    locked: [],
  },
  {
    id: 11,
    desc: "entanglement",
    task:
      "Using a control node, create an entangled pair of qubits with the same state " +
      "( superposition of [i]|00⟩[/i] and [i]|11⟩[/i] )\n\n" +
      "[b]Hint :[/b]\nwhen dealing with superpositions, you can treat each basis state as its own case or its own universe. " +
      "the activation of a controlled gate is only affected by the state of the control bit in each separate case/universe.",
    input: [0, 0],
    prob: true,
    output: [
      complex(0.707107, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0.707107, 0),
    ],
    gates: [Gate.Empty, Gate.X, Gate.H, Gate.Ctrl],
    locked: [],
  },
  {
    id: 12,
    desc: "entanglement",
    task:
      "Create an entangled pair of qubits with the opposite state " +
      "( superposition of [i]|01⟩[/i] and [i]|10⟩[/i] )",
    input: [0, 0],
    prob: true,
    output: [
      complex(0, 0),
      complex(0.707107, 0),
      complex(0.707107, 0),
      complex(0, 0),
    ],
    gates: [Gate.Empty, Gate.X, Gate.H, Gate.Ctrl],
    locked: [],
  },
  {
    id: 13,
    desc: "phase intro",
    task: "Turn the qubit back into state [i]|0⟩[/i]",
    input: [0],
    prob: true,
    output: [complex(1, 0), complex(0, 0)],
    gates: [Gate.Empty, Gate.X, Gate.H, Gate.Ctrl],
    locked: [[0, 0, Gate.H]],
  },
  {
    id: 14,
    desc: "phase again",
    task: "[b]Input : [/b] [i]|ψ⟩ = ( |0⟩ - |1⟩ )/sqrt(2)[/i]\n\nTurn the qubit into state [i]|0⟩[/i]",
    input: null,
    nQ: 1,
    istate: [complex(0.707107, 0), complex(-0.707107, 0)],
    prob: true,
    output: [complex(1, 0), complex(0, 0)],
    gates: [Gate.Empty, Gate.X, Gate.H, Gate.Ctrl],
    locked: [],
  },
  {
    id: 15,
    desc: "flip probability",
    task:
      "[b]Input : [/b] The input state has 30% probability of [i]|0⟩[/i]" +
      "and 70% probability of [i]|1⟩[/i]\n\n" +
      "flip it so it has " +
      "30% probability of [i]|1⟩[/i] and 70% probability of [i]|0⟩[/i]",
    input: null,
    nQ: 1,
    istate: [complex(Math.sqrt(0.3), 0), complex(Math.sqrt(0.7), 0)],
    prob: true,
    output: [complex(Math.sqrt(0.7), 0), complex(Math.sqrt(0.3), 0)],
    gates: [Gate.Empty, Gate.X, Gate.H, Gate.Ctrl],
    locked: [],
  },
  {
    id: 16,
    desc: "phase flip",
    task: "Turn the qubit into state [i](|0⟩ - |1⟩)/sqrt(2)[/i]",
    input: [0],
    prob: false,
    output: [complex(1 / Math.sqrt(2), 0), complex(-1 / Math.sqrt(2), 0)],
    gates: [Gate.Empty, Gate.H, Gate.Z],
    locked: [],
  },
  {
    id: 17,
    desc: "phase flip some more",
    task:
      "Turn the qubit from [i]|0⟩[/i] to [i]|1⟩[/i] using only " +
      "Hadamard and Pauli-Z gate.",
    input: [0],
    prob: true,
    output: [complex(0, 0), complex(1, 0)],
    gates: [Gate.Empty, Gate.H, Gate.Z],
    locked: [],
  },
  {
    id: 18,
    desc: "Y gate",
    task: "Create the state ( [i]–i|0⟩ – i|1⟩[/i] )/sqrt(2)",
    input: [0],
    prob: false,
    output: [complex(0, -1 / Math.sqrt(2)), complex(0, -1 / Math.sqrt(2))],
    gates: [Gate.Empty, Gate.H, Gate.X, Gate.Y, Gate.Z],
    locked: [],
  },
  {
    id: 19,
    desc: "S gate",
    task: "Create the state [i]–i|1⟩[/i]",
    input: [0],
    prob: false,
    output: [complex(0, 0), complex(0, -1)],
    gates: [Gate.Empty, Gate.X, Gate.S, Gate.Z],
    locked: [],
  },
  {
    id: 20,
    desc: "superposition prepare",
    task:
      "Prepare a system of qubits that's in a superposition of " +
      "[i]|100⟩[/i], [i]|101⟩[/i], [i]|110⟩[/i], and [i]|111⟩[/i] with uniform probability",
    input: [0, 0, 0],
    prob: true,
    output: [
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0.5, 0),
      complex(0.5, 0),
      complex(0.5, 0),
      complex(0.5, 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 21,
    desc: "superposition prepare with entanglement",
    task:
      "Prepare a system of qubits that's in a superposition of " +
      "[i]|000⟩[/i], [i]|001⟩[/i], [i]|110⟩[/i], and [i]|111⟩[/i] with uniform probability",
    input: [0, 0, 0],
    prob: true,
    output: [
      complex(0.5, 0),
      complex(0.5, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0.5, 0),
      complex(0.5, 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 22,
    desc: "prob swap",
    task:
      "[b]Input : [/b] The input state is\n[i]|ψ⟩ = [/i]" +
      "√(0.1)[i]|00⟩ +[/i] √(0.2)[i]|01⟩ +[/i] √(0.3)[i]|10⟩ +[/i] √(0.4)[i]|11⟩[/i]\n\n" +
      "Swap the probability of getting [i]|10⟩[/i] and [i]|11⟩[/i]\n\n" +
      "[b]Expected Output :[/b]\n" +
      "[i]|00⟩[/i] : 10%\n[i]|01⟩[/i] : 20%\n[i]|10⟩[/i] : 40%\n[i]|11⟩[/i] : 30%",
    input: null,
    nQ: 2,
    istate: [
      complex(Math.sqrt(0.1), 0),
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.3), 0),
      complex(Math.sqrt(0.4), 0),
    ],
    prob: true,
    output: [
      complex(Math.sqrt(0.1), 0),
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.4), 0),
      complex(Math.sqrt(0.3), 0),
    ],
    gates: [Gate.Empty, Gate.H, Gate.X, Gate.Z, Gate.Ctrl],
    locked: [],
  },
  {
    id: 23,
    desc: "X using YSZ",
    task: "Flip the qubit into state [i]+|1⟩[/i] using Y,S,Z gate only",
    input: [0],
    prob: false,
    output: [complex(0, 0), complex(1, 0)],
    gates: [Gate.Empty, Gate.Y, Gate.S, Gate.Z],
    locked: [],
  },
  {
    id: 24,
    desc: "AND gate",
    task:
      "Create an equivalent of AND gate\n( [i]Q2 = Q0 AND Q1[/i] )\n\n" +
      "if [i]Q0 = |0⟩[/i] and [i]Q1 = |1⟩[/i], then [i]Q2 = |0⟩[/i] since [i]0 AND 1 = 0[/i]. " +
      "this equation is represented by the state [i]|010⟩[/i]\n\n" +
      "The hadamard gate in the first column is to represent all the possible input\n\n" +
      "[b]Expected Output :[/b]\n" +
      "Uniform superposition of " +
      "[i]|000⟩, |010⟩, |100⟩,[/i] and [i]|111⟩[/i]\n",
    input: [0, 0, 0],
    prob: true,
    output: [
      complex(0.5, 0),
      complex(0, 0),
      complex(0.5, 0),
      complex(0, 0),
      complex(0.5, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0.5, 0),
    ],
    gates: ALL_GATES,
    locked: [
      [0, 0, Gate.H],
      [1, 0, Gate.H],
      [2, 0, Gate.Empty],
    ],
  },
  {
    id: 25,
    desc: "OR gate",
    task:
      "Create an equivalent of OR gate\n( [i]Q2 = Q0 OR Q1[/i] )\n\n" +
      "[b]Expected Output :[/b]\n" +
      "Uniform superposition of " +
      "[i]|000⟩, |011⟩, |101⟩,[/i] and [i]|111⟩[/i]\n",
    input: [0, 0, 0],
    prob: true,
    output: [
      complex(0.5, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0.5, 0),
      complex(0, 0),
      complex(0.5, 0),
      complex(0, 0),
      complex(0.5, 0),
    ],
    gates: ALL_GATES,
    locked: [
      [0, 0, Gate.H],
      [1, 0, Gate.H],
      [2, 0, Gate.Empty],
    ],
  },
  {
    id: 26,
    desc: "Clearing entanglement",
    task:
      "The input state is an entangled state\n[i]|ψ⟩ = |00⟩ + |11⟩[/i].\n\n" +
      "Make the output 100% [i]|00⟩[/i]",
    input: null,
    nQ: 2,
    istate: [
      complex(Math.sqrt(0.5), 0),
      complex(0, 0),
      complex(0, 0),
      complex(Math.sqrt(0.5), 0),
    ],
    prob: true,
    output: [complex(1, 0), complex(0, 0), complex(0, 0), complex(0, 0)],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 27,
    desc: "Clearing entanglement again",
    task:
      "The input state is an entangled state\n[i]|ψ⟩ = |000⟩ + |111⟩[/i].\n\n" +
      "Make the output 100% [i]|010⟩[/i]",
    input: null,
    nQ: 3,
    istate: [
      complex(Math.sqrt(0.5), 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(Math.sqrt(0.5), 0),
    ],
    prob: true,
    output: [
      complex(0, 0),
      complex(0, 0),
      complex(1, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 28,
    desc: "Swap qubit",
    task:
      "The top qubit has 20% chance of [i]|0⟩[/i] and 80% of [i]|1⟩[/i].\n" +
      "The bottom qubit is 100% [i]|0⟩[/i].\n" +
      "Swap the top qubit and the bottom qubit\n\n" +
      "[b]Expected Output :[/b]\n" +
      "[i]|00⟩[/i] : 20%\n[i]|01⟩[/i] : 80%",
    input: null,
    nQ: 2,
    istate: [
      complex(Math.sqrt(0.2), 0),
      complex(0, 0),
      complex(Math.sqrt(0.8), 0),
      complex(0, 0),
    ],
    prob: false,
    output: [
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.8), 0),
      complex(0, 0),
      complex(0, 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 29,
    desc: "prob swap inside",
    task:
      "[b]Input : [/b] The input state is\n[i]|ψ⟩ = [/i]" +
      "√(0.1)[i]|00⟩ +[/i] √(0.2)[i]|01⟩ +[/i] √(0.3)[i]|10⟩ +[/i] √(0.4)[i]|11⟩[/i]\n\n" +
      "Swap the probability of getting [i]|10⟩[/i] and [i]|01⟩[/i]\n\n" +
      "[b]Expected Output :[/b]\n" +
      "[i]|00⟩[/i] : 10%\n[i]|01⟩[/i] : 30%\n[i]|10⟩[/i] : 20%\n[i]|11⟩[/i] : 40%",
    input: null,
    nQ: 2,
    istate: [
      complex(Math.sqrt(0.1), 0),
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.3), 0),
      complex(Math.sqrt(0.4), 0),
    ],
    prob: true,
    output: [
      complex(Math.sqrt(0.1), 0),
      complex(Math.sqrt(0.3), 0),
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.4), 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 30,
    desc: "combining",
    task:
      "[b]Expected Output :[/b]\n" +
      "[i]|00⟩[/i] : 20%\n[i]|11⟩[/i] : 80%\n\n" +
      "[b]Input : [/b] The input state is [i]|ψ⟩[/i], where\n" +
      "[i]|00⟩[/i] : 20%\n[i]|10⟩[/i] : 40%\n[i]|11⟩[/i] : 40%",
    input: null,
    nQ: 2,
    istate: [
      complex(Math.sqrt(0.2), 0),
      complex(0, 0),
      complex(Math.sqrt(0.4), 0),
      complex(Math.sqrt(0.4), 0),
    ],
    prob: true,
    output: [
      complex(Math.sqrt(0.2), 0),
      complex(0, 0),
      complex(0, 0),
      complex(Math.sqrt(0.8), 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 31,
    desc: "Phase thing",
    task:
      "Create a superposition of all possible states, with negative imaginary component\n\n" +
      "[b]Expected Output :[/b]\n" +
      "[i]– [/i]√(0.5)i[i] |0⟩\n– [/i]√(0.5)i [i]|1⟩[/i]\n" +
      "≈\n[i]– [/i]0.7071i [i]|0⟩\n– [/i]0.7071i [i]|1⟩[/i]",
    input: [0],
    prob: false,
    output: [complex(0, -0.707107), complex(0, -0.707107)],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 32,
    desc: "Phase thing again",
    task:
      "Create a superposition of all possible states, with negative imaginary component\n\n" +
      "[b]Expected Output :[/b]\n" +
      "[i]– [/i]0.5i[i] |00⟩[/i]\n" +
      "[i]– [/i]0.5i[i] |01⟩[/i]\n" +
      "[i]– [/i]0.5i[i] |10⟩[/i]\n" +
      "[i]– [/i]0.5i[i] |11⟩[/i]\n",
    input: [0, 0],
    prob: false,
    output: [
      complex(0, -0.5),
      complex(0, -0.5),
      complex(0, -0.5),
      complex(0, -0.5),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 33,
    desc: "splitting",
    task:
      "[b]Expected Output :[/b]\n" +
      "[i]|00⟩[/i] : 20%\n[i]|01⟩[/i] : 20%\n[i]|10⟩[/i] : 30%\n[i]|11⟩[/i] : 30%\n\n" +
      "[b]Input : [/b] The input state is [i]|ψ⟩[/i], where\n" +
      "[i]|00⟩[/i] : 40%\n[i]|10⟩[/i] : 30%\n[i]|11⟩[/i] : 30%",
    input: null,
    nQ: 2,
    istate: [
      complex(Math.sqrt(0.4), 0),
      complex(0, 0),
      complex(Math.sqrt(0.3), 0),
      complex(Math.sqrt(0.3), 0),
    ],
    prob: true,
    output: [
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.3), 0),
      complex(Math.sqrt(0.3), 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 34,
    desc: "prob reverse order",
    task:
      "[b]Input : [/b] The input state is\n[i]|ψ⟩ = [/i]" +
      "√(0.1)[i]|00⟩ +[/i] √(0.2)[i]|01⟩ +[/i] √(0.3)[i]|10⟩ +[/i] √(0.4)[i]|11⟩[/i]\n\n" +
      "Reverse the order of the probabilities\n\n" +
      "[b]Expected Output :[/b]\n" +
      "[i]|00⟩[/i] : 40%\n[i]|01⟩[/i] : 30%\n[i]|10⟩[/i] : 20%\n[i]|11⟩[/i] : 10%",
    input: null,
    nQ: 2,
    istate: [
      complex(Math.sqrt(0.1), 0),
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.3), 0),
      complex(Math.sqrt(0.4), 0),
    ],
    prob: true,
    output: [
      complex(Math.sqrt(0.4), 0),
      complex(Math.sqrt(0.3), 0),
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.1), 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 35,
    desc: "collapsing and splitting",
    task:
      "[b]Expected Output :[/b]\n" +
      "[i]|00⟩[/i] : 20%\n[i]|01⟩[/i] : 20%\n[i]|11⟩[/i] : 60%\n\n" +
      "[b]Input : [/b] The input state is [i]|ψ⟩[/i], where\n" +
      "[i]|00⟩[/i] : 40%\n[i]|10⟩[/i] : 30%\n[i]|11⟩[/i] : 30%",
    input: null,
    nQ: 2,
    istate: [
      complex(Math.sqrt(0.4), 0),
      complex(0, 0),
      complex(Math.sqrt(0.3), 0),
      complex(Math.sqrt(0.3), 0),
    ],
    prob: true,
    output: [
      complex(Math.sqrt(0.2), 0),
      complex(Math.sqrt(0.2), 0),
      complex(0, 0),
      complex(Math.sqrt(0.6), 0),
    ],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 36,
    desc: "negating",
    task:
      "Turn the qubit back into the input state. " +
      "(cancel out all the initially placed gates)",
    input: null,
    nQ: 3,
    istate: [
      complex(Math.sqrt(0.21), 0),
      complex(Math.sqrt(0.32), 0),
      complex(0, Math.sqrt(0.43)),
      complex(0, Math.sqrt(0.04)),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
    ],
    prob: false,
    output: [
      complex(Math.sqrt(0.21), 0),
      complex(Math.sqrt(0.32), 0),
      complex(0, Math.sqrt(0.43)),
      complex(0, Math.sqrt(0.04)),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
      complex(0, 0),
    ],
    gates: ALL_GATES,
    locked: [
      [0, 0, Gate.H],
      [1, 0, Gate.Empty],
      [2, 0, Gate.Z],
      [0, 1, Gate.Ctrl],
      [1, 1, Gate.X],
      [2, 1, Gate.X],
      [0, 2, Gate.S],
      [1, 2, Gate.Empty],
      [2, 2, Gate.Empty],
    ],
  },
  {
    id: 37,
    desc: "Hadamard thing",
    task: "Make the output 100% [i]|11⟩[/i]",
    input: [0, 1],
    prob: true,
    output: [complex(0, 0), complex(0, 0), complex(0, 0), complex(1, 0)],
    gates: ALL_GATES,
    locked: [
      [0, 4, Gate.H],
      [1, 4, Gate.Ctrl],
      [0, 11, Gate.Ctrl],
      [1, 11, Gate.H],
    ],
  },
  {
    id: 101,
    desc: "sanbox 1bit",
    task: "[This is a sandbox environment.]",
    input: [0],
    prob: true,
    output: [],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 102,
    desc: "sanbox 2bit",
    task: "[This is a sandbox environment.]",
    input: [0, 0],
    prob: true,
    output: [],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 103,
    desc: "sanbox 3bit",
    task: "[This is a sandbox environment.]",
    input: [0, 0, 0],
    prob: true,
    output: [],
    gates: ALL_GATES,
    locked: [],
  },
  {
    id: 104,
    desc: "sandbox 4bit",
    task: "[This is a sandbox environment.]",
    input: [0, 0, 0, 0],
    prob: true,
    output: [],
    gates: ALL_GATES,
    locked: [],
  },
];

export const LEVELS: readonly Level[] = definitions.map((definition) => {
  const { id, desc, task, input, istate, nQ, prob, output, gates, locked } =
    definition;
  return {
    id,
    description: desc,
    task,
    input:
      input !== null
        ? { kind: "basis", bits: input }
        : { kind: "state", qubits: nQ!, amplitudes: istate! },
    goal: output.length
      ? { kind: prob ? "probability" : "amplitude", amplitudes: output }
      : null,
    gates,
    locked,
  };
});
