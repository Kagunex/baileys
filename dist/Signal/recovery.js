/**
 * Recovery when session data is corrupt.
 */
import { deserializeSession } from "./session.js";
import { sessionAddressKey, deleteSession } from "./session-store.js";
/**
 * Load session; if corrupt, delete and report recovered.
 */
export async function loadSessionHealthy(keys, name, deviceId = 0) {
    const id = sessionAddressKey(name, deviceId);
    const map = await keys.get("session", [id]);
    const raw = map[id];
    if (!raw)
        return { ok: false, reason: "missing", recovered: false };
    try {
        const session = deserializeSession(raw);
        // basic structural validation
        if (!session.rootKey || session.rootKey.length !== 32) {
            throw new Error("invalid rootKey");
        }
        if (!session.sending?.chainKey || !session.receiving?.chainKey) {
            throw new Error("invalid chains");
        }
        return { ok: true, session };
    }
    catch (err) {
        await deleteSession(keys, name, deviceId);
        return {
            ok: false,
            reason: err instanceof Error ? err.message : "corrupt",
            recovered: true,
        };
    }
}
/** Validate serialized session bytes without loading into store */
export function validateSessionBytes(data) {
    try {
        const s = deserializeSession(data);
        return !!(s.rootKey?.length === 32 && s.sending?.chainKey && s.receiving?.chainKey);
    }
    catch {
        return false;
    }
}
/**
 * Remove all sessions matching prefix (e.g. after identity rotation).
 */
export async function purgeSessions(keys, ids) {
    const set = { session: {} };
    for (const id of ids)
        set.session[id] = null;
    await keys.set(set);
    return ids.length;
}
//# sourceMappingURL=recovery.js.map