/**
 * Recovery when session data is corrupt.
 */

import type { SignalKeyStore } from "../Types/Auth.js";
import { deserializeSession, type SignalSessionState } from "./session.js";
import { sessionAddressKey, deleteSession } from "./session-store.js";

export type SessionHealth =
  | { ok: true; session: SignalSessionState }
  | { ok: false; reason: string; recovered: boolean };

/**
 * Load session; if corrupt, delete and report recovered.
 */
export async function loadSessionHealthy(
  keys: SignalKeyStore,
  name: string,
  deviceId = 0,
): Promise<SessionHealth> {
  const id = sessionAddressKey(name, deviceId);
  const map = await keys.get("session", [id]);
  const raw = map[id];
  if (!raw) return { ok: false, reason: "missing", recovered: false };

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
  } catch (err) {
    await deleteSession(keys, name, deviceId);
    return {
      ok: false,
      reason: err instanceof Error ? err.message : "corrupt",
      recovered: true,
    };
  }
}

/** Validate serialized session bytes without loading into store */
export function validateSessionBytes(data: Uint8Array): boolean {
  try {
    const s = deserializeSession(data);
    return !!(s.rootKey?.length === 32 && s.sending?.chainKey && s.receiving?.chainKey);
  } catch {
    return false;
  }
}

/**
 * Remove all sessions matching prefix (e.g. after identity rotation).
 */
export async function purgeSessions(
  keys: SignalKeyStore,
  ids: string[],
): Promise<number> {
  const set: { session: { [id: string]: null } } = { session: {} };
  for (const id of ids) set.session[id] = null;
  await keys.set(set);
  return ids.length;
}
