/**
 * Session / connection persistence helpers (alongside multi-file auth).
 */

import { promises as fs } from "node:fs";
import path from "node:path";

export type PersistedSessionMeta = {
  lastConnectedAt?: number;
  lastDisconnectReason?: string;
  platform?: string;
  /** opaque routing info base64 */
  routingInfo?: string;
};

export async function loadSessionMeta(folder: string): Promise<PersistedSessionMeta> {
  const file = path.join(folder, "session-meta.json");
  try {
    return JSON.parse(await fs.readFile(file, "utf-8")) as PersistedSessionMeta;
  } catch {
    return {};
  }
}

export async function saveSessionMeta(
  folder: string,
  meta: PersistedSessionMeta,
): Promise<void> {
  await fs.mkdir(folder, { recursive: true });
  const file = path.join(folder, "session-meta.json");
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(meta, null, 2), "utf-8");
  await fs.rename(tmp, file);
}
