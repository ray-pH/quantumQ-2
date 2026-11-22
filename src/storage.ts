import { importLegacySave } from "@quantumq/core";
import type { LegacySave, SaveStorage } from "@quantumq/core";
import { invoke, isTauri } from "@tauri-apps/api/core";
import { LazyStore } from "@tauri-apps/plugin-store";

const browserKey = "quantumq.save";

function browserStorage(): SaveStorage {
  const database = new Promise<IDBDatabase | null>((resolve) => {
    if (typeof indexedDB === "undefined") {
      resolve(null);
      return;
    }
    const request = indexedDB.open("quantumq", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("profile");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });

  return {
    async load() {
      const db = await database;
      if (db) {
        const current = await new Promise<unknown>((resolve, reject) => {
          const request = db
            .transaction("profile")
            .objectStore("profile")
            .get("save");
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        });
        if (current !== undefined) return current;
      }

      const legacy = localStorage.getItem(browserKey);
      return legacy === null ? undefined : JSON.parse(legacy);
    },
    async save(data) {
      const db = await database;
      if (!db) {
        localStorage.setItem(browserKey, JSON.stringify(data));
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction("profile", "readwrite");
        transaction.oncomplete = () => resolve();
        transaction.onabort = () => reject(transaction.error);
        transaction.objectStore("profile").put(data, "save");
      });
    },
  };
}

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

  return browserStorage();
}
