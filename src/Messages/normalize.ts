import type { WAMessage } from "../Types/Messages.js";

export function normalizeMessage(msg: WAMessage): WAMessage {
  return {
    ...msg,
    key: {
      ...msg.key,
      fromMe: !!msg.key.fromMe,
      id: msg.key.id ?? "",
      remoteJid: msg.key.remoteJid ?? "",
    },
    messageTimestamp:
      typeof msg.messageTimestamp === "number"
        ? msg.messageTimestamp
        : Math.floor(Date.now() / 1000),
  };
}
