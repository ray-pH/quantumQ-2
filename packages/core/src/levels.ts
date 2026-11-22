import catalog from "./levels.json" with { type: "json" };
import { goalSchema } from "./goal.ts";
import type { Level } from "./types.ts";

type LevelDefinition = Omit<Level, "goal"> & { goal: unknown };

export const SECTIONS: Readonly<Partial<Record<number, string>>> =
  catalog.sections;
export const LEVELS: readonly Level[] = (
  catalog.levels as LevelDefinition[]
).map(({ goal, ...level }) => ({ ...level, goal: goalSchema.parse(goal) }));
