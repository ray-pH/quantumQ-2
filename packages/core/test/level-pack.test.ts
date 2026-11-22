import { describe, expect, it } from "vitest";
import {
  createGameApp,
  createMemoryStorage,
  levelPackKey,
  parseLevelPack,
} from "../src/index.ts";

function manifest(id = "first") {
  return {
    formatVersion: 1,
    "author-id": "tester@example.com",
    id,
    name: "Test pack",
    gates: [
      {
        id: "flip",
        name: "Bit flip",
        symbol: "F",
        matrix: [
          [
            [0, 0],
            [1, 0],
          ],
          [
            [1, 0],
            [0, 0],
          ],
        ],
      },
    ],
    sections: [
      {
        name: "Introduction",
        levels: [
          {
            id: 1,
            description: "Controlled custom gate",
            task: "Flip the second qubit.",
            input: { kind: "basis", bits: [1, 0] },
            goal: {
              kind: "amplitude",
              amplitudes: [
                [0, 0],
                [0, 0],
                [0, 0],
                [1, 0],
              ],
            },
            gates: ["empty", "flip"],
            locked: [[0, 0, "control"]],
          },
        ],
      },
      {
        name: "Practice",
        levels: [
          {
            id: 2,
            description: "All set",
            task: "Evaluate the input.",
            input: { kind: "basis", bits: [0] },
            goal: {
              kind: "amplitude",
              amplitudes: [
                [1, 0],
                [0, 0],
              ],
            },
            gates: ["empty"],
          },
        ],
      },
    ],
  };
}

describe("custom level packs", () => {
  it.each([
    "qubit_lab",
    "0bcf8129-bbdc-4daf-99ca-70f869c9210f",
    "tester+packs@example.com",
  ])("accepts %s as an author ID", (authorId) => {
    const pack = parseLevelPack({ ...manifest(), "author-id": authorId });
    expect(levelPackKey(pack)).toBe(`${authorId}/first`);
  });

  it("keeps custom runs, pack order, and completion separate from built-in progress", async () => {
    const storage = createMemoryStorage({
      version: 1,
      unlocked: [1],
      useNotSymbol: true,
    });
    const game = await createGameApp({ storage });
    const first = parseLevelPack(manifest());
    const second = parseLevelPack(manifest("second"));
    const firstKey = levelPackKey(first);
    const secondKey = levelPackKey(second);
    await game.installLevelPack(first);
    await game.installLevelPack(second);
    await expect(
      game.installLevelPack({ ...first, version: "2" }),
    ).rejects.toThrow(firstKey);
    await game.moveLevelPack(secondKey, -1);

    expect(game.openLevel(1, firstKey)).toBe(true);
    expect(game.evaluate()?.solved).toBe(false);
    expect(game.placeGate(0, 0)).toBe(false);
    expect(game.selectGate("flip")).toBe(true);
    expect(game.placeGate(1, 0)).toBe(true);
    expect(game.evaluate()).toMatchObject({ solved: true, nextLevelId: 2 });
    expect(game.nextLevel()).toBe(true);
    expect(game.getState().board?.pack).toBe(first);
    expect(game.evaluate()).toMatchObject({ solved: true, nextLevelId: null });
    await game.flushSave();

    const reopened = await createGameApp({ storage });
    const save = reopened.getState().save;
    expect(save.packs.map(levelPackKey)).toEqual([secondKey, firstKey]);
    expect(save.packProgress[firstKey]).toEqual([1, 2]);
    expect(save.packProgress[secondKey]).toEqual([]);
    expect(save.useNotSymbol).toBe(true);
    expect(save.unlocked).toContain(1);
    expect(save.unlocked).not.toContain(2);
    expect(reopened.openLevel(1)).toBe(true);
    expect(reopened.getState().board?.pack).toBeNull();
  });

  it("requires every listed puzzle and skips locked puzzles when continuing", async () => {
    const source = manifest();
    const [intro, practice] = source.sections;
    const puzzle = practice.levels[0];
    const pack = parseLevelPack({
      ...source,
      sections: [
        intro,
        {
          ...practice,
          levels: [
            { ...puzzle, id: 3, unlockAfter: [1, 2] },
            puzzle,
            { ...puzzle, id: 4, unlockAfter: [2] },
            { ...puzzle, id: 5, goal: null, unlockAfter: [3] },
          ],
        },
      ],
    });
    const storage = createMemoryStorage({
      version: 1,
      unlocked: [1, 2, 3],
      useNotSymbol: false,
    });
    const game = await createGameApp({ storage });
    const key = levelPackKey(pack);
    await game.installLevelPack(pack);

    expect(game.openLevel(3, key)).toBe(false);
    expect(game.openLevel(1, key)).toBe(true);
    game.selectGate("flip");
    game.placeGate(1, 0);
    expect(game.evaluate()?.nextLevelId).toBe(2);
    expect(game.openLevel(3, key)).toBe(false);
    expect(game.nextLevel()).toBe(true);
    expect(game.getState().board?.level.id).toBe(2);
    expect(game.evaluate()?.nextLevelId).toBe(4);
    expect(game.nextLevel()).toBe(true);
    expect(game.getState().board?.level.id).toBe(4);
    expect(game.openLevel(5, key)).toBe(false);
    expect(game.openLevel(3, key)).toBe(true);
    expect(game.evaluate()?.solved).toBe(true);
    await game.flushSave();

    const reopened = await createGameApp({ storage });
    expect(reopened.openLevel(5, key)).toBe(true);
    expect(reopened.getState().save.packProgress[key]).toEqual([1, 3, 2]);
  });

  it.each([
    [[2], { unlockAfter: [1] }, "circular unlock prerequisite"],
    [[1], {}, "circular unlock prerequisite"],
    [[2, 2], {}, "repeated unlock prerequisite"],
    [[2], { goal: null }, "requires level 2 to be a puzzle in this pack"],
    [[9], {}, "requires level 9 to be a puzzle in this pack"],
  ])(
    "rejects invalid unlock requirements %j, %j",
    (unlockAfter, changes, error) => {
      const source = manifest();
      const [intro, practice] = source.sections;
      expect(() =>
        parseLevelPack({
          ...source,
          sections: [
            { ...intro, levels: [{ ...intro.levels[0], unlockAfter }] },
            { ...practice, levels: [{ ...practice.levels[0], ...changes }] },
          ],
        }),
      ).toThrow(error);
    },
  );

  it("rejects reserved gates, non-unitary gates, and duplicate levels", () => {
    const reserved = manifest();
    reserved.gates[0].id = "x";
    expect(() => parseLevelPack(reserved)).toThrow('Gate ID "x"');

    const invalid = manifest();
    invalid.gates[0].matrix[0][1] = [2, 0];
    expect(() => parseLevelPack(invalid)).toThrow("unitary matrix");

    const duplicate = manifest();
    duplicate.sections[1].levels[0].id = 1;
    expect(() => parseLevelPack(duplicate)).toThrow(
      "Level ID 1 is already defined",
    );
  });
});
