/** Small shared helpers used across modules. */
import { randomBytes } from "node:crypto";

export function generateRegistrationId(): number {
  return Math.floor(Math.random() * 16384);
}

export function generateMessageID(): string {
  return "3EB0" + randomBytes(8).toString("hex").toUpperCase();
}

export function jidEncode(user: string, server: string, device?: number, agent?: number): string {
  let jid = user;
  if (typeof agent === "number" && agent > 0) jid += `_${agent}`;
  if (typeof device === "number" && device > 0) jid += `:${device}`;
  return `${jid}@${server}`;
}

export function jidDecode(jid: string): {
  user: string;
  server: string;
  device?: number;
  agent?: number;
} | undefined {
  const at = jid.indexOf("@");
  if (at < 0) return undefined;
  const server = jid.slice(at + 1);
  let userPart = jid.slice(0, at);
  let device: number | undefined;
  let agent: number | undefined;
  const colon = userPart.indexOf(":");
  if (colon >= 0) {
    device = parseInt(userPart.slice(colon + 1), 10) || 0;
    userPart = userPart.slice(0, colon);
  }
  const underscore = userPart.indexOf("_");
  if (underscore >= 0) {
    agent = parseInt(userPart.slice(underscore + 1), 10) || 0;
    userPart = userPart.slice(0, underscore);
  }
  return { user: userPart, server, device, agent };
}

export function isJidUser(jid: string): boolean {
  return jid.endsWith("@s.whatsapp.net") || jid.endsWith("@c.us");
}

export function isJidGroup(jid: string): boolean {
  return jid.endsWith("@g.us");
}

export function isJidBroadcast(jid: string): boolean {
  return jid.endsWith("@broadcast");
}

export function isJidStatusBroadcast(jid: string): boolean {
  return jid === "status@broadcast";
}

export function normalizeJid(jid: string): string {
  if (jid.endsWith("@c.us")) return jid.replace(/@c\.us$/, "@s.whatsapp.net");
  return jid;
}

export function unixTimestampSeconds(date: Date = new Date()): number {
  return Math.floor(date.getTime() / 1000);
}
