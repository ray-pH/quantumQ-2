import { z } from "zod";
import { goalSchema } from "./goal.ts";
import { probability, qubitCount } from "./simulator.ts";
import { ALL_GATES, COLUMN_COUNT, Gate, MAX_QUBITS } from "./types.ts";
import type { Complex, Level, Matrix } from "./types.ts";

export type CustomGate = Readonly<{
  id: string;
  name: string;
  symbol: string;
  matrix: Matrix;
  image?: string;
}>;

export type PackSection = Readonly<{
  name: string;
  levels: readonly Level[];
}>;

export type LevelPack = Readonly<{
  formatVersion: 1;
  "author-id": string;
  id: string;
  name: string;
  version?: string;
  gates: readonly CustomGate[];
  sections: readonly PackSection[];
}>;

const MAX_LEVELS = 128;
const MAX_IMAGE_BYTES = 512 * 1024;
const TOLERANCE = 0.0001;
const identifier = z
  .string()
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/);
const name = z.string().trim().min(1).max(100);
const levelId = z.number().int().min(0).max(999999);
const complex = z.tuple([z.number(), z.number()]);
const amplitudes = z
  .array(complex)
  .min(2)
  .max(2 ** MAX_QUBITS);
const matrixRow = z.tuple([complex, complex]);
const bit = z.union([z.literal(0), z.literal(1)]);

const levelSchema = z.object({
  id: levelId,
  description: name,
  task: z.string().min(1).max(4000),
  help: z.array(z.string().max(4000)).max(12).optional(),
  unlockAfter: z.array(levelId).max(MAX_LEVELS).optional(),
  input: z.discriminatedUnion("kind", [
    z.object({
      kind: z.literal("basis"),
      bits: z.array(bit).min(1).max(MAX_QUBITS),
    }),
    z.object({
      kind: z.literal("state"),
      qubits: z.number().int().min(1).max(MAX_QUBITS),
      amplitudes,
    }),
  ]),
  goal: goalSchema,
  gates: z.array(identifier).min(1).max(32),
  locked: z
    .array(
      z.tuple([
        z.number().int().nonnegative(),
        z.number().int().nonnegative(),
        identifier,
      ]),
    )
    .max(MAX_QUBITS * COLUMN_COUNT)
    .default([]),
});

const packSchema = z.object({
  formatVersion: z.literal(1),
  "author-id": z
    .string()
    .max(120)
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9_.+@-]*$/,
      "Use a username, generated ID, or email address without spaces or slashes.",
    ),
  id: identifier,
  name,
  version: z.string().trim().min(1).max(32).optional(),
  gates: z
    .array(
      z.object({
        id: identifier,
        name,
        symbol: z.string().trim().min(1).max(8),
        matrix: z.tuple([matrixRow, matrixRow]),
        image: z.string().optional(),
      }),
    )
    .max(32)
    .default([]),
  sections: z
    .array(
      z.object({
        name,
        levels: z.array(levelSchema).min(1).max(MAX_LEVELS),
      }),
    )
    .min(1)
    .max(32),
});

export function levelPackKey(
  pack: Pick<LevelPack, "author-id" | "id">,
): string {
  return `${pack["author-id"]}/${pack.id}`;
}

export function packLevels(pack: LevelPack): readonly Level[] {
  return pack.sections.flatMap(({ levels }) => levels);
}

export function isPackLevelUnlocked(
  level: Level,
  completed: readonly number[],
): boolean {
  return level.unlockAfter?.every((id) => completed.includes(id)) ?? true;
}

function validateUnlocks(levels: ReadonlyMap<number, Level>) {
  const checked = new Set<number>();
  const visiting = new Set<number>();

  function visit({ id, unlockAfter = [] }: Level) {
    if (checked.has(id)) return;
    if (visiting.has(id))
      throw new Error(`Level ${id} has a circular unlock prerequisite.`);
    if (new Set(unlockAfter).size !== unlockAfter.length)
      throw new Error(`Level ${id} has a repeated unlock prerequisite.`);

    visiting.add(id);
    for (const prerequisiteId of unlockAfter) {
      const prerequisite = levels.get(prerequisiteId);
      if (!prerequisite?.goal) {
        throw new Error(
          `Level ${id} requires level ${prerequisiteId} to be a puzzle in this pack.`,
        );
      }
      visit(prerequisite);
    }
    visiting.delete(id);
    checked.add(id);
  }

  for (const level of levels.values()) visit(level);
}

function normalized(state: readonly Complex[]): boolean {
  return (
    Math.abs(
      state.reduce((total, value) => total + probability(value), 0) - 1,
    ) < TOLERANCE
  );
}

function isUnitary([first, second]: Matrix): boolean {
  const [[ar, ai], [br, bi]] = first;
  const [[cr, ci], [dr, di]] = second;
  const real = ar * cr + ai * ci + br * dr + bi * di;
  const imaginary = ai * cr - ar * ci + bi * dr - br * di;
  return (
    normalized(first) &&
    normalized(second) &&
    Math.hypot(real, imaginary) < TOLERANCE
  );
}

function readImageData(image: string): string {
  if (
    image.length > 22 + Math.ceil(MAX_IMAGE_BYTES / 3) * 4 ||
    !/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(image)
  ) {
    throw new Error(
      "Gate images must be embedded PNG files of at most 512 KiB.",
    );
  }
  return image;
}

export function parseLevelPack(
  value: unknown,
  resolveImage?: (path: string) => string,
): LevelPack {
  const result = packSchema.safeParse(value);
  if (!result.success) {
    const issue = result.error.issues[0];
    throw new Error(
      `Invalid pack field "${issue.path.join(".") || "pack"}". ${issue.message}`,
    );
  }

  const pack = result.data;
  const gateIds = new Set<string>(ALL_GATES);
  const gates = pack.gates.map((gate) => {
    if (gateIds.has(gate.id))
      throw new Error(`Gate ID "${gate.id}" is already defined.`);
    gateIds.add(gate.id);
    if (!isUnitary(gate.matrix))
      throw new Error(`Gate "${gate.id}" must have a unitary matrix.`);
    const image =
      gate.image === undefined
        ? undefined
        : readImageData(resolveImage ? resolveImage(gate.image) : gate.image);
    return { ...gate, image };
  });

  const levels = packLevels(pack);
  if (levels.length > MAX_LEVELS)
    throw new Error(`A pack can contain at most ${MAX_LEVELS} levels.`);

  const levelsById = new Map<number, Level>();
  for (const level of levels) {
    if (levelsById.has(level.id))
      throw new Error(`Level ID ${level.id} is already defined in this pack.`);
    levelsById.set(level.id, level);
    const qubits = qubitCount(level.input);
    const validateState = (state: readonly Complex[], label: string) => {
      if (state.length !== 2 ** qubits || !normalized(state)) {
        throw new Error(
          `Level ${level.id} must have a normalized ${label} with ${2 ** qubits} amplitudes.`,
        );
      }
    };
    if (level.input.kind === "state")
      validateState(level.input.amplitudes, "input");
    if (level.goal) validateState(level.goal.amplitudes, "goal");
    if (
      !level.gates.includes(Gate.Empty) ||
      level.gates.some((id) => !gateIds.has(id)) ||
      new Set(level.gates).size !== level.gates.length
    ) {
      throw new Error(
        `Level ${level.id} must have a palette of unique defined gates that includes "empty".`,
      );
    }

    const cells = new Set<number>();
    for (const [row, column, gate] of level.locked) {
      const cell = row * COLUMN_COUNT + column;
      if (
        row >= qubits ||
        column >= COLUMN_COUNT ||
        !gateIds.has(gate) ||
        cells.has(cell)
      ) {
        throw new Error(
          `Level ${level.id} has an invalid or repeated locked cell at (${row}, ${column}).`,
        );
      }
      cells.add(cell);
    }
  }

  validateUnlocks(levelsById);
  return { ...pack, gates };
}
