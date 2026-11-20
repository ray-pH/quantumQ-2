import { importLegacySave } from "@quantumq/core";
import type { LegacySave, SaveStorage } from "@quantumq/core";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";

const browserKey = "quantumq.save";

export function getStorage(): SaveStorage {
  if (isTauri()) {
    const store = new LazyStore("quantumq.json", { autoSave: false });
    const storage: SaveStorage = {
      async load() {
        const current = await store.get("save");
        if (current !== undefined && current !== null) return current;

        const imported = importLegacySave(
          await invoke<LegacySave>("read_legacy_save"),
        );
        if (imported) await storage.save(imported);
        return imported;
      },
      async save(data) {
        await store.set("save", data);
        await store.save();
      },
    };
    return storage;
  }

  return {
    async load() {
      const encoded = localStorage.getItem(browserKey);
      return encoded === null ? undefined : JSON.parse(encoded);
    },
    async save(data) {
      localStorage.setItem(browserKey, JSON.stringify(data));
    },
  };
}
