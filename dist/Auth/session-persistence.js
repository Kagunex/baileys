/**
 * Session / connection persistence helpers (alongside multi-file auth).
 */
import { promises as fs } from "node:fs";
import path from "node:path";
export async function loadSessionMeta(folder) {
    const file = path.join(folder, "session-meta.json");
    try {
        return JSON.parse(await fs.readFile(file, "utf-8"));
    }
    catch {
        return {};
    }
}
export async function saveSessionMeta(folder, meta) {
    await fs.mkdir(folder, { recursive: true });
    const file = path.join(folder, "session-meta.json");
    const tmp = `${file}.${process.pid}.tmp`;
    await fs.writeFile(tmp, JSON.stringify(meta, null, 2), "utf-8");
    await fs.rename(tmp, file);
}
//# sourceMappingURL=session-persistence.js.map