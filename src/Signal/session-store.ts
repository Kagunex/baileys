/**
 * High-level Signal session persistence on top of SignalKeyStore.
 */

import type { SignalKeyStore } from "../Types/Auth.js";
import {
  serializeSession,
  deserializeSession,
  type SignalSessionState,
} from "./session.js";

const TYPE = "session" as const;

export function sessionAddressKey(name: string, deviceId = 0): string {
  return `${name}.${deviceId}`;
}

export async function loadSession(
  keys: SignalKeyStore,
  name: string,
  deviceId = 0,
): Promise<SignalSessionState | undefined> {
  const id = sessionAddressKey(name, deviceId);
  const map = await keys.get(TYPE, [id]);
  const raw = map[id];
  if (!raw) return undefined;
  try {
    return deserializeSession(raw);
  } catch {
    return undefined;
  }
}

export async function saveSession(
  keys: SignalKeyStore,
  session: SignalSessionState,
  deviceId = 0,
): Promise<void> {
  const id = sessionAddressKey(session.remoteAddress, deviceId);
  const bytes = serializeSession(session);
  await keys.set({ session: { [id]: bytes } });
}

export async function deleteSession(
  keys: SignalKeyStore,
  name: string,
  deviceId = 0,
): Promise<void> {
  const id = sessionAddressKey(name, deviceId);
  await keys.set({ session: { [id]: null } });
}

export async function listSessionIds(keys: SignalKeyStore, ids: string[]): Promise<string[]> {
  const map = await keys.get(TYPE, ids);
  return Object.keys(map);
}
