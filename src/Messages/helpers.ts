import type { WAMessage } from "../Types/Messages.js";

export function getMessageType(msg: WAMessage): string | undefined {
  const m = msg.message;
  if (!m) return undefined;
  if (m.conversation) return "conversation";
  if (m.extendedTextMessage) return "extendedTextMessage";
  if (m.imageMessage) return "imageMessage";
  if (m.videoMessage) return "videoMessage";
  if (m.audioMessage) return "audioMessage";
  if (m.documentMessage) return "documentMessage";
  if (m.stickerMessage) return "stickerMessage";
  if (m.reactionMessage) return "reactionMessage";
  if (m.contactMessage) return "contactMessage";
  if (m.locationMessage) return "locationMessage";
  return Object.keys(m)[0] as string | undefined;
}

export function extractMessageText(msg: WAMessage): string | undefined {
  const m = msg.message;
  if (!m) return undefined;
  return (
    m.conversation ||
    m.extendedTextMessage?.text ||
    m.imageMessage?.caption ||
    m.videoMessage?.caption ||
    (m.documentMessage as { caption?: string } | undefined)?.caption ||
    m.reactionMessage?.text
  ) as string | undefined;
}
