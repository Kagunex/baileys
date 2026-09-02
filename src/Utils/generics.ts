/**
 * Generic helpers: IDs, registration, jid utils.
 */

import { randomBytes } from "node:crypto";

/** 14-bit registration ID as used by Signal / WA. */
export function generateRegistrationId(): number {
  return randomBytes(2).readUInt16BE(0) & 0x3fff;
}

/**
 * Generate a WA-style message ID (uppercase hex, 16–18 chars).
 */
export function generateMessageID(prefix = ""): string {
  const id = randomBytes(8).toString("hex").toUpperCase();
  return prefix ? `${prefix}${id}` : id;
}

export function unixTimestampSeconds(date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
}

export function isJidUser(jid?: string | null): boolean {
  return !!jid && jid.endsWith("@s.whatsapp.net");
}

export function isJidGroup(jid?: string | null): boolean {
  return !!jid && jid.endsWith("@g.us");
}

export function isJidBroadcast(jid?: string | null): boolean {
  return !!jid && jid.endsWith("@broadcast");
}

export function jidNormalizedUser(jid?: string | null): string | undefined {
  if (!jid) return undefined;
  const [user, server] = jid.split("@");
  if (!user) return jid;
  const bare = user.split(":")[0];
  return `${bare}@${server || "s.whatsapp.net"}`;
}

export function jidDecode(
  jid?: string | null,
): { user: string; server: string; device?: number } | undefined {
  if (!jid) return undefined;
  const [userPart, server] = jid.split("@");
  if (!userPart || !server) return undefined;
  const [user, deviceStr] = userPart.split(":");
  return {
    user: user || userPart,
    server,
    device: deviceStr != null ? Number(deviceStr) || 0 : undefined,
  };
}
