import type {
  AnyMessageContent,
  WAMessage,
  WAMessageContent,
  WAMessageKey,
  MessageGenerationOptions,
} from "../Types/Messages.js";
import { generateMessageID } from "../Utils/generics.js";

export function generateWAMessage(
  jid: string,
  content: AnyMessageContent,
  options: MessageGenerationOptions = {},
): WAMessage {
  const key: WAMessageKey = {
    remoteJid: jid,
    fromMe: true,
    id: options.messageId ?? generateMessageID(),
  };
  return {
    key,
    message: contentToProto(content, options),
    messageTimestamp: options.timestamp ?? Math.floor(Date.now() / 1000),
  };
}

export function generateWAMessageFromContent(
  jid: string,
  message: WAMessageContent,
  options: MessageGenerationOptions = {},
): WAMessage {
  return {
    key: {
      remoteJid: jid,
      fromMe: true,
      id: options.messageId ?? generateMessageID(),
    },
    message,
    messageTimestamp: options.timestamp ?? Math.floor(Date.now() / 1000),
  };
}

function contentToProto(
  content: AnyMessageContent,
  options: MessageGenerationOptions,
): WAMessageContent {
  const c = content as Record<string, any>;
  if ("react" in c && c.react) {
    return {
      reactionMessage: {
        text: c.react.text,
        key: c.react.key,
      },
    };
  }

  if ("text" in c && c.text !== undefined) {
    const quoted = c.quoted || options.quoted;
    if (c.mentions?.length || quoted) {
      return {
        extendedTextMessage: {
          text: c.text,
          contextInfo: {
            mentionedJid: c.mentions,
            stanzaId: quoted?.key?.id,
            participant: quoted?.key?.participant,
            quotedMessage: quoted?.message || undefined,
          },
        },
      };
    }
    return { conversation: c.text };
  }

  if ("image" in c) {
    return {
      imageMessage: {
        caption: c.caption,
        mimetype: c.mimetype || "image/jpeg",
      },
    };
  }
  if ("video" in c) {
    return {
      videoMessage: {
        caption: c.caption,
        mimetype: c.mimetype || "video/mp4",
      },
    };
  }
  if ("audio" in c) {
    return {
      audioMessage: {
        mimetype: c.mimetype || "audio/ogg; codecs=opus",
        ptt: c.ptt,
      },
    };
  }
  if ("document" in c) {
    return {
      documentMessage: {
        mimetype: c.mimetype || "application/octet-stream",
        fileName: c.fileName,
      },
    };
  }
  if ("sticker" in c) {
    return { stickerMessage: { mimetype: "image/webp" } };
  }
  if ("contact" in c) {
    return {
      contactMessage: {
        displayName: c.contact.fullName,
        vcard: c.contact.vcard,
      },
    };
  }
  if ("location" in c) {
    return {
      locationMessage: {
        degreesLatitude: c.location.degreesLatitude,
        degreesLongitude: c.location.degreesLongitude,
        name: c.location.name,
        address: c.location.address,
      },
    };
  }

  throw new Error("Unsupported message content");
}
