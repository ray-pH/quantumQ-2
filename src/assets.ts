import { Gate } from "@quantumq/core";
import type { CustomGate } from "@quantumq/core";

export function asset(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path}`;
}

export const gateNames: Record<Gate, string> = {
  [Gate.Empty]: "Empty (erase)",
  [Gate.H]: "Hadamard (H)",
  [Gate.X]: "Pauli-X (NOT)",
  [Gate.Y]: "Pauli-Y",
  [Gate.Z]: "Pauli-Z",
  [Gate.Ctrl]: "Control",
  [Gate.S]: "Phase (S)",
};

export function gateName(gate: string, customGate?: CustomGate): string {
  return customGate?.name ?? gateNames[gate as Gate];
}

const gateSprites: Record<Gate, string> = {
  [Gate.Empty]: "gateEmpty",
  [Gate.H]: "gateH",
  [Gate.X]: "gateX",
  [Gate.Y]: "gateY",
  [Gate.Z]: "gateZ",
  [Gate.Ctrl]: "gateCtrl",
  [Gate.S]: "gateS",
};

export function gateImage(gate: Gate, useNotSymbol: boolean, hover = false) {
  const sprite =
    gate === Gate.X && useNotSymbol ? "gateNOT" : gateSprites[gate];
  return asset(`sprites/${sprite}${hover ? "hover" : ""}.png`);
}
