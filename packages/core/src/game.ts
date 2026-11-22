import { LEVELS } from "./levels.ts";
import { isPackLevelUnlocked, levelPackKey, packLevels } from "./level-pack.ts";
import type { CustomGate, LevelPack } from "./level-pack.ts";
import { TUTORIALS } from "./tutorials.ts";
import {
  evaluateCircuit,
  isSolution,
  probability,
  qubitCount,
} from "./simulator.ts";
import { readSave } from "./save.ts";
import type { SaveData, SaveStorage } from "./save.ts";
import { COLUMN_COUNT, Gate } from "./types.ts";
import type { Circuit, Complex, Level } from "./types.ts";

export type ResultRow = Readonly<{
  basis: string;
  amplitude: Complex;
  probability: number;
}>;

export type Evaluation = Readonly<{
  rows: readonly ResultRow[];
  solved: boolean;
  nextLevelId: number | null;
}>;

export type Board = Readonly<{
  level: Level;
  pack: LevelPack | null;
  customGates: ReadonlyMap<string, CustomGate>;
  help: readonly string[];
  circuit: Circuit;
  selectedGate: string;
  result: Evaluation | null;
}>;

export type GameState = Readonly<{
  board: Board | null;
  save: SaveData;
  saveError: boolean;
}>;

type Subscriber = (state: GameState) => void;

const puzzles = LEVELS.filter(({ goal }) => goal !== null);

function createBoard(level: Level, pack: LevelPack | null): Board {
  const circuit = Array.from({ length: qubitCount(level.input) }, () =>
    Array<string>(COLUMN_COUNT).fill(Gate.Empty),
  );
  for (const [row, column, gate] of level.locked) circuit[row][column] = gate;

  return {
    level,
    pack,
    customGates: new Map(pack?.gates.map((gate) => [gate.id, gate])),
    help: (pack ? level.help : TUTORIALS[level.id]) ?? [],
    circuit,
    selectedGate: level.gates[0],
    result: null,
  };
}

export async function createGameApp({ storage }: { storage: SaveStorage }) {
  let state: GameState = {
    board: null,
    save: readSave(await storage.load()),
    saveError: false,
  };
  const subscribers = new Set<Subscriber>();
  let pendingSave = Promise.resolve();

  function update(patch: Partial<GameState>) {
    state = { ...state, ...patch };
    for (const subscriber of subscribers) subscriber(state);
  }

  function persist(
    save: SaveData,
    patch: Pick<Partial<GameState>, "board"> = {},
  ) {
    pendingSave = pendingSave.then(async () => {
      try {
        await storage.save(save);
        update({ saveError: false });
      } catch {
        update({ saveError: true });
      }
    });
    update({ ...patch, save });
    return pendingSave;
  }

  function openLevel(id: number, packKey?: string): boolean {
    const pack =
      packKey === undefined
        ? null
        : state.save.packs.find(
            (candidate) => levelPackKey(candidate) === packKey,
          );
    if (pack === undefined) return false;
    const level = (pack ? packLevels(pack) : LEVELS).find(
      (level) => level.id === id,
    );
    if (!level) return false;
    const unlocked =
      packKey === undefined
        ? state.save.unlocked.includes(id)
        : isPackLevelUnlocked(level, state.save.packProgress[packKey] ?? []);
    if (!unlocked) return false;

    update({ board: createBoard(level, pack) });
    return true;
  }

  return {
    getState: () => state,
    subscribe(subscriber: Subscriber) {
      subscribers.add(subscriber);
      subscriber(state);
      return () => {
        subscribers.delete(subscriber);
      };
    },
    openLevel,
    returnToMenu() {
      update({ board: null });
    },
    selectGate(gate: string): boolean {
      const { board } = state;
      if (!board?.level.gates.includes(gate)) return false;

      update({ board: { ...board, selectedGate: gate } });
      return true;
    },
    placeGate(row: number, column: number): boolean {
      const { board } = state;
      if (
        !board ||
        !Number.isInteger(row) ||
        !Number.isInteger(column) ||
        board.circuit[row]?.[column] === undefined ||
        board.level.locked.some(([r, c]) => r === row && c === column)
      )
        return false;

      const circuit = board.circuit.map((wire, index) =>
        index === row
          ? wire.map((gate, cell) =>
              cell === column ? board.selectedGate : gate,
            )
          : wire,
      );
      update({ board: { ...board, circuit } });
      return true;
    },
    evaluate(): Evaluation | null {
      const { board, save } = state;
      if (!board) return null;

      const amplitudes = evaluateCircuit(
        board.circuit,
        board.level.input,
        board.customGates,
      );
      const solved =
        board.level.goal !== null && isSolution(amplitudes, board.level.goal);
      const sequence = board.pack
        ? packLevels(board.pack).filter(({ goal }) => goal !== null)
        : puzzles;
      const packKey = board.pack ? levelPackKey(board.pack) : undefined;
      const completed =
        packKey === undefined ? [] : (save.packProgress[packKey] ?? []);
      const completedAfter =
        packKey !== undefined && solved && !completed.includes(board.level.id)
          ? [...completed, board.level.id]
          : completed;
      const nextLevelId = solved
        ? (sequence
            .slice(sequence.indexOf(board.level) + 1)
            .find(
              (level) =>
                !board.pack || isPackLevelUnlocked(level, completedAfter),
            )?.id ?? null)
        : null;
      const result = {
        rows: amplitudes.map((amplitude, index) => ({
          basis: index.toString(2).padStart(board.circuit.length, "0"),
          amplitude,
          probability: probability(amplitude),
        })),
        solved,
        nextLevelId,
      };
      const patch = { board: { ...board, result } };
      if (packKey !== undefined && completedAfter !== completed) {
        void persist(
          {
            ...save,
            packProgress: { ...save.packProgress, [packKey]: completedAfter },
          },
          patch,
        );
      } else if (
        packKey === undefined &&
        nextLevelId !== null &&
        !save.unlocked.includes(nextLevelId)
      ) {
        void persist(
          { ...save, unlocked: [...save.unlocked, nextLevelId] },
          patch,
        );
      } else {
        update(patch);
      }
      return result;
    },
    nextLevel(): boolean {
      const board = state.board;
      const nextId = board?.result?.nextLevelId;
      return (
        nextId != null &&
        openLevel(nextId, board?.pack ? levelPackKey(board.pack) : undefined)
      );
    },
    async installLevelPack(pack: LevelPack) {
      const key = levelPackKey(pack);
      if (
        state.save.packs.some((candidate) => levelPackKey(candidate) === key)
      ) {
        throw new Error(
          `A level pack with the identifier "${key}" is already installed.`,
        );
      }
      await persist({ ...state.save, packs: [...state.save.packs, pack] });
    },
    moveLevelPack(key: string, direction: -1 | 1) {
      const packs = [...state.save.packs];
      const index = packs.findIndex((pack) => levelPackKey(pack) === key);
      const destination = index + direction;
      if (index < 0 || destination < 0 || destination >= packs.length) return;
      const [pack] = packs.splice(index, 1);
      packs.splice(destination, 0, pack);
      return persist({ ...state.save, packs });
    },
    setUseNotSymbol(useNotSymbol: boolean) {
      return persist({ ...state.save, useNotSymbol });
    },
    retrySave() {
      return persist(state.save);
    },
    flushSave() {
      return pendingSave;
    },
  };
}

export type GameApp = Awaited<ReturnType<typeof createGameApp>>;
