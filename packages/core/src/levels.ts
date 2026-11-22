import catalog from "./levels.json" with { type: "json" };
import type { Level } from "./types.ts";

export const SECTIONS: Readonly<Partial<Record<number, string>>> =
  catalog.sections;
export const LEVELS: readonly Level[] = catalog.levels as Level[];
