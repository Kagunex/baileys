/**
 * High-level Signal session persistence on top of SignalKeyStore.
 */
import { serializeSession, deserializeSession, } from "./session.js";
const TYPE = "session";
export function sessionAddressKey(name, deviceId = 0) {
    return `${name}.${deviceId}`;
}
export async function loadSession(keys, name, deviceId = 0) {
    const id = sessionAddressKey(name, deviceId);
    const map = await keys.get(TYPE, [id]);
    const raw = map[id];
    if (!raw)
        return undefined;
    try {
        return deserializeSession(raw);
    }
    catch {
        return undefined;
    }
}
export async function saveSession(keys, session, deviceId = 0) {
    const id = sessionAddressKey(session.remoteAddress, deviceId);
    const bytes = serializeSession(session);
    await keys.set({ session: { [id]: bytes } });
}
export async function deleteSession(keys, name, deviceId = 0) {
    const id = sessionAddressKey(name, deviceId);
    await keys.set({ session: { [id]: null } });
}
export async function listSessionIds(keys, ids) {
    const map = await keys.get(TYPE, ids);
    return Object.keys(map);
}
//# sourceMappingURL=session-store.js.map