import type { SignalKeyStore } from "../Types/Auth.js";

/** In-memory Signal key store for tests / ephemeral use. */
export function makeInMemorySignalKeyStore(): SignalKeyStore {
  const data = new Map<string, Map<string, unknown>>();
  return {
    async get(type, ids) {
      const bucket = data.get(type) ?? new Map();
      const out: Record<string, unknown> = {};
      for (const id of ids) {
        if (bucket.has(id)) out[id] = bucket.get(id);
      }
      return out as any;
    },
    async set(dataset) {
      for (const [type, entries] of Object.entries(dataset)) {
        if (!entries) continue;
        let bucket = data.get(type);
        if (!bucket) {
          bucket = new Map();
          data.set(type, bucket);
        }
        for (const [id, value] of Object.entries(entries)) {
          if (value == null) bucket.delete(id);
          else bucket.set(id, value);
        }
      }
    },
    async clear() {
      data.clear();
    },
  };
}
