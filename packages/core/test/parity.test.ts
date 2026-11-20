import { describe, expect, it } from "vitest";
import {
  COLUMN_COUNT,
  Gate,
  LEVELS,
  createGameApp,
  createMemoryStorage,
  evaluateCircuit,
  importLegacySave,
  isSolution,
} from "../src/index.ts";
import type { Level } from "../src/index.ts";
import { qubitCount } from "../src/simulator.ts";
import fixtures from "./godot-circuits.json";

// Captured with Godot 3.6.1 using its original evaluator on every board's input and
// locked cells. Unlocked cells use a deterministic mix of all seven gate types.
const godotGates = [
  Gate.Empty,
  Gate.H,
  Gate.X,
  Gate.Y,
  Gate.Z,
  Gate.Ctrl,
  Gate.S,
];

describe("Godot evaluator parity", () => {
  it("covers the original catalog and valid board data", () => {
    expect(LEVELS.filter((level) => level.goal)).toHaveLength(38);
    expect(LEVELS.filter((level) => !level.goal)).toHaveLength(4);
    expect(fixtures.map(({ id }) => id)).toEqual(LEVELS.map(({ id }) => id));
    for (const level of LEVELS) {
      const count = qubitCount(level.input);
      if (level.input.kind === "state")
        expect(level.input.amplitudes).toHaveLength(2 ** count);
      if (level.goal) expect(level.goal.amplitudes).toHaveLength(2 ** count);
      for (const [row, column] of level.locked) {
        expect(row).toBeGreaterThanOrEqual(0);
        expect(row).toBeLessThan(count);
        expect(column).toBeGreaterThanOrEqual(0);
        expect(column).toBeLessThan(COLUMN_COUNT);
      }
    }
  });

  it.each(fixtures)(
    "matches the Godot state vector for board $id",
    ({ id, columns, state }) => {
      const level = LEVELS.find((level) => level.id === id) as Level;
      const circuit = Array.from(
        { length: qubitCount(level.input) },
        (_, row) => columns.map((column) => godotGates[column[row]]),
      );
      const actual = evaluateCircuit(circuit, level.input);

      expect(actual).toHaveLength(state.length);
      for (const [index, [real, imaginary]] of actual.entries()) {
        expect(real).toBeCloseTo(state[index][0], 6);
        expect(imaginary).toBeCloseTo(state[index][1], 6);
      }
    },
  );

  it("checks phase and probability targets independently", () => {
    expect(
      isSolution([[0, 1]], { kind: "probability", amplitudes: [[1, 0]] }),
    ).toBe(true);
    expect(
      isSolution([[0, 1]], { kind: "amplitude", amplitudes: [[1, 0]] }),
    ).toBe(false);
    expect(
      isSolution([[1, 0.00009]], { kind: "amplitude", amplitudes: [[1, 0]] }),
    ).toBe(true);
    expect(
      isSolution([[1, 0.0001]], { kind: "amplitude", amplitudes: [[1, 0]] }),
    ).toBe(false);
  });

  it("requires every control wire to be set before applying the column's gate", () => {
    const circuit = [[Gate.Ctrl], [Gate.Ctrl], [Gate.Y]];

    const enabled = evaluateCircuit(circuit, {
      kind: "basis",
      bits: [1, 1, 0],
    });
    expect(enabled[7]).toEqual([0, 1]);
    expect(enabled[6]).toEqual([0, 0]);

    const disabled = evaluateCircuit(circuit, {
      kind: "basis",
      bits: [1, 0, 0],
    });
    expect(disabled[4]).toEqual([1, 0]);
    expect(disabled[5]).toEqual([0, 0]);
  });
});

describe("progress and puzzle rules", () => {
  it("requires a correct result to unlock the next level and restores it after a relaunch", async () => {
    const storage = createMemoryStorage();
    const app = await createGameApp({ storage });
    expect(app.openLevel(1)).toBe(false);
    expect(app.openLevel(0)).toBe(true);
    expect(app.evaluate()?.solved).toBe(true);
    expect(app.nextLevel()).toBe(true);
    expect(app.getState().board?.level.id).toBe(1);
    expect(app.evaluate()?.solved).toBe(false);
    expect(app.selectGate(Gate.H)).toBe(false);
    expect(app.selectGate(Gate.X)).toBe(true);
    expect(app.placeGate(0, 0)).toBe(true);
    expect(app.evaluate()?.solved).toBe(true);

    await app.setUseNotSymbol(true);
    const reopened = await createGameApp({ storage });
    expect(reopened.openLevel(2)).toBe(true);
    expect(reopened.getState().save.useNotSymbol).toBe(true);
  });

  it("imports original save files, rejects edits to fixed gates, and handles sandbox evaluation", async () => {
    const imported = importLegacySave({
      progress: '{"0":true,"4":true,"37":true,"99":true,"101":false}\n',
      options: "true\n",
    });
    expect(imported?.unlocked).toEqual([0, 4, 37, 101, 102, 103, 104]);
    expect(imported?.useNotSymbol).toBe(true);

    const app = await createGameApp({ storage: createMemoryStorage(imported) });
    expect(app.openLevel(4)).toBe(true);
    expect(app.placeGate(1, 3)).toBe(false);
    expect(app.placeGate(1, 12)).toBe(false);
    expect(app.selectGate(Gate.Ctrl)).toBe(true);
    expect(app.placeGate(0, 3)).toBe(true);
    expect(app.evaluate()?.nextLevelId).toBe(5);

    expect(app.openLevel(104)).toBe(true);
    expect(app.evaluate()?.rows).toHaveLength(16);
    expect(app.evaluate()?.solved).toBe(false);
    expect(app.nextLevel()).toBe(false);
  });

  it("retries the most recent save after a write failure", async () => {
    const memory = createMemoryStorage();
    let fail = true;
    const app = await createGameApp({
      storage: {
        load: memory.load,
        async save(data) {
          if (fail) throw new Error("disk temporarily unavailable");
          await memory.save(data);
        },
      },
    });

    app.openLevel(0);
    app.evaluate();
    await app.flushSave();
    expect(app.getState().saveError).toBe(true);
    fail = false;
    await app.retrySave();
    expect(app.getState().saveError).toBe(false);
    expect((await createGameApp({ storage: memory })).openLevel(1)).toBe(true);
  });

  it("completes the last puzzle without advancing into the sandboxes", async () => {
    const app = await createGameApp({
      storage: createMemoryStorage({
        version: 1,
        unlocked: [37],
        useNotSymbol: false,
      }),
    });
    expect(app.openLevel(37)).toBe(true);
    app.selectGate(Gate.H);
    app.placeGate(0, 0);
    app.placeGate(1, 6);
    app.selectGate(Gate.Ctrl);
    app.placeGate(1, 0);
    app.placeGate(0, 6);
    app.selectGate(Gate.X);
    app.placeGate(0, 5);

    expect(app.evaluate()).toMatchObject({ solved: true, nextLevelId: null });
    expect(app.nextLevel()).toBe(false);
  });
});
