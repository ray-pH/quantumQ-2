import { LEVELS } from "./levels.ts";

export type SaveData = Readonly<{
  version: 1;
  unlocked: readonly number[];
  useNotSymbol: boolean;
}>;

export interface SaveStorage {
  load(): Promise<unknown>;
  save(data: SaveData): Promise<void>;
}

export type LegacySave = Readonly<{
  progress: string | null;
  options: string | null;
}>;

const levelIds = LEVELS.map(({ id }) => id);
const defaultUnlocked = LEVELS.filter(
  ({ id, goal }) => id === 0 || goal === null,
).map(({ id }) => id);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function createSave(
  unlocked: readonly unknown[],
  useNotSymbol: boolean,
): SaveData {
  return {
    version: 1,
    unlocked: levelIds.filter(
      (id) => defaultUnlocked.includes(id) || unlocked.includes(id),
    ),
    useNotSymbol,
  };
}

export function readSave(value: unknown): SaveData {
  if (value === undefined || value === null) return createSave([], false);
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.unlocked) ||
    typeof value.useNotSymbol !== "boolean"
  ) {
    throw new Error("QuantumQ could not read this save format.");
  }

  return createSave(value.unlocked, value.useNotSymbol);
}

function readLegacyLine(text: string | null): unknown {
  if (text === null) return undefined;

  try {
    return JSON.parse(text.split(/\r?\n/, 1)[0]);
  } catch {
    return undefined;
  }
}

export function importLegacySave({
  progress,
  options,
}: LegacySave): SaveData | undefined {
  const flags = readLegacyLine(progress);
  const useNotSymbol = readLegacyLine(options);
  if (!record(flags) && typeof useNotSymbol !== "boolean") return undefined;

  const unlocked = record(flags)
    ? levelIds.filter((id) => flags[id] === true)
    : [];
  return createSave(unlocked, useNotSymbol === true);
}

export function createMemoryStorage(initial?: unknown): SaveStorage {
  let value = initial;
  return {
    async load() {
      return value;
    },
    async save(data) {
      value = data;
    },
  };
}
