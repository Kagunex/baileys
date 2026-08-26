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
  if ("react" in content && content.react) {
    return {
      reactionMessage: {
        text: content.react.text,
        key: content.react.key,
      },
    };
  }

  if ("text" in content && content.text !== undefined) {
    const quoted = content.quoted || options.quoted;
    if (content.mentions?.length || quoted) {
      return {
        extendedTextMessage: {
          text: content.text,
          contextInfo: {
            mentionedJid: content.mentions,
            stanzaId: quoted?.key?.id,
            participant: quoted?.key?.participant,
            quotedMessage: quoted?.message || undefined,
          },
        },
      };
    }
    return { conversation: content.text };
  }

  if ("image" in content) {
    return {
      imageMessage: {
        caption: content.caption,
        mimetype: content.mimetype || "image/jpeg",
      },
    };
  }
  if ("video" in content) {
    return {
      videoMessage: {
        caption: content.caption,
        mimetype: content.mimetype || "video/mp4",
      },
    };
  }
  if ("audio" in content) {
    return {
      audioMessage: {
        mimetype: content.mimetype || "audio/ogg; codecs=opus",
        ptt: content.ptt,
      },
    };
  }
  if ("document" in content) {
    return {
      documentMessage: {
        mimetype: content.mimetype || "application/octet-stream",
        fileName: content.fileName,
      },
    };
  }
  if ("sticker" in content) {
    return { stickerMessage: { mimetype: "image/webp" } };
  }
  if ("contact" in content) {
    return {
      contactMessage: {
        displayName: content.contact.fullName,
        vcard: content.contact.vcard,
      },
    };
  }
  if ("location" in content) {
    return {
      locationMessage: {
        degreesLatitude: content.location.degreesLatitude,
        degreesLongitude: content.location.degreesLongitude,
        name: content.location.name,
        address: content.location.address,
      },
    };
  }

  throw new Error("Unsupported message content");
}
