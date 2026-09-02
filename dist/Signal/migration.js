/**
 * Session / store schema migration.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
export const SIGNAL_STORE_VERSION = 2;
export async function loadStoreMeta(folder) {
    try {
        const raw = await fs.readFile(path.join(folder, "store-meta.json"), "utf-8");
        return JSON.parse(raw);
    }
    catch {
        return { version: 0 };
    }
}
export async function saveStoreMeta(folder, meta) {
    await fs.mkdir(folder, { recursive: true });
    const file = path.join(folder, "store-meta.json");
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(meta, null, 2));
    await fs.rename(tmp, file);
}
/**
 * Migrate key store folder to current schema version.
 * v0/v1 → v2: ensure store-meta exists; future migrations append here.
 */
export async function migrateSignalStore(folder) {
    const meta = await loadStoreMeta(folder);
    if (meta.version >= SIGNAL_STORE_VERSION)
        return meta;
    // Place-holder migrations:
    // v1: no-op structural
    // v2: mark migrated
    const next = {
        version: SIGNAL_STORE_VERSION,
        migratedAt: Date.now(),
    };
    await saveStoreMeta(folder, next);
    return next;
}
//# sourceMappingURL=migration.js.map