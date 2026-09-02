/**
 * Transaction-safe multi-file Signal key store.
 * - atomic write (tmp + rename)
 * - per-process mutex queue for set()
 * - journal file for crash recovery of in-flight batches
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { encodeBase64, decodeBase64 } from "../Utils/buffers.js";
async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}
async function atomicWrite(filePath, data) {
    await ensureDir(path.dirname(filePath));
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, data);
    await fs.rename(tmp, filePath);
}
function keyFilePath(folder, type, id) {
    const safe = id.replace(/[^a-zA-Z0-9._\-@]/g, "_");
    return path.join(folder, `${type}-${safe}.json`);
}
function serializeValue(value) {
    if (Buffer.isBuffer(value) || value instanceof Uint8Array) {
        return { __type: "buffer", data: encodeBase64(Buffer.from(value)) };
    }
    if (Array.isArray(value))
        return value.map(serializeValue);
    if (value && typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value))
            out[k] = serializeValue(v);
        return out;
    }
    return value;
}
function reviveValue(value) {
    if (value && typeof value === "object" && value.__type === "buffer") {
        return new Uint8Array(decodeBase64(value.data));
    }
    if (Array.isArray(value))
        return value.map(reviveValue);
    if (value && typeof value === "object") {
        const out = {};
        for (const [k, v] of Object.entries(value))
            out[k] = reviveValue(v);
        return out;
    }
    return value;
}
/** Simple async mutex */
function createMutex() {
    let chain = Promise.resolve();
    return function run(fn) {
        const next = chain.then(fn, fn);
        chain = next.then(() => undefined, () => undefined);
        return next;
    };
}
export function makeCacheableSignalKeyStore(folder) {
    const mutex = createMutex();
    const journalPath = path.join(folder, ".key-journal.json");
    async function recoverJournal() {
        try {
            const raw = await fs.readFile(journalPath, "utf-8");
            const entries = JSON.parse(raw);
            for (const e of entries) {
                try {
                    if (e.op === "delete")
                        await fs.unlink(e.file).catch(() => undefined);
                    else if (e.payload != null)
                        await atomicWrite(e.file, e.payload);
                }
                catch {
                    /* */
                }
            }
            await fs.unlink(journalPath).catch(() => undefined);
        }
        catch {
            /* no journal */
        }
    }
    // best-effort recovery on construct
    void recoverJournal();
    return {
        async get(type, ids) {
            await ensureDir(folder);
            const result = {};
            await Promise.all(ids.map(async (id) => {
                try {
                    const raw = await fs.readFile(keyFilePath(folder, type, id), "utf-8");
                    result[id] = reviveValue(JSON.parse(raw));
                }
                catch {
                    /* missing */
                }
            }));
            return result;
        },
        async set(data) {
            return mutex(async () => {
                await ensureDir(folder);
                const journal = [];
                for (const type of Object.keys(data)) {
                    const entries = data[type];
                    if (!entries)
                        continue;
                    for (const id of Object.keys(entries)) {
                        const value = entries[id];
                        const file = keyFilePath(folder, type, id);
                        if (value == null) {
                            journal.push({ file, op: "delete" });
                        }
                        else {
                            const payload = JSON.stringify(serializeValue(value));
                            journal.push({ file, op: "write", payload });
                        }
                    }
                }
                // write journal first
                if (journal.length) {
                    await atomicWrite(journalPath, JSON.stringify(journal));
                }
                // apply
                for (const e of journal) {
                    if (e.op === "delete") {
                        await fs.unlink(e.file).catch(() => undefined);
                    }
                    else if (e.payload != null) {
                        await atomicWrite(e.file, e.payload);
                    }
                }
                await fs.unlink(journalPath).catch(() => undefined);
            });
        },
        async clear() {
            return mutex(async () => {
                try {
                    const files = await fs.readdir(folder);
                    await Promise.all(files
                        .filter((f) => f.endsWith(".json") || f.startsWith(".key-"))
                        .map((f) => fs.unlink(path.join(folder, f)).catch(() => undefined)));
                }
                catch {
                    /* */
                }
            });
        },
    };
}
//# sourceMappingURL=key-store.js.map