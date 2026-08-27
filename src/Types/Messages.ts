export type WAMessageKey = {
  remoteJid?: string;
  fromMe?: boolean;
  id?: string;
  participant?: string;
};

export type WAMessageContent = {
  conversation?: string;
  extendedTextMessage?: {
    text?: string;
    contextInfo?: {
      mentionedJid?: string[];
      stanzaId?: string;
      participant?: string;
      quotedMessage?: WAMessageContent;
    };
  };
  imageMessage?: { caption?: string; mimetype?: string; url?: string; mediaKey?: Uint8Array };
  videoMessage?: { caption?: string; mimetype?: string; url?: string; mediaKey?: Uint8Array };
  audioMessage?: { mimetype?: string; ptt?: boolean; url?: string; mediaKey?: Uint8Array };
  documentMessage?: {
    mimetype?: string;
    fileName?: string;
    caption?: string;
    url?: string;
    mediaKey?: Uint8Array;
  };
  stickerMessage?: { mimetype?: string; url?: string; mediaKey?: Uint8Array };
  contactMessage?: { displayName?: string; vcard?: string };
  locationMessage?: {
    degreesLatitude?: number;
    degreesLongitude?: number;
    name?: string;
    address?: string;
  };
  reactionMessage?: { text?: string; key?: WAMessageKey };
  protocolMessage?: { type?: number; key?: WAMessageKey };
};

export type WAMessage = {
  key: WAMessageKey;
  message?: WAMessageContent | null;
  messageTimestamp?: number;
  status?: number;
  participant?: string;
  pushName?: string;
  messageStubType?: number;
};

export type AnyMessageContent =
  | { text: string; mentions?: string[]; quoted?: WAMessage }
  | { image: Buffer | Uint8Array; caption?: string; mimetype?: string }
  | { video: Buffer | Uint8Array; caption?: string; mimetype?: string; gifPlayback?: boolean }
  | { audio: Buffer | Uint8Array; mimetype?: string; ptt?: boolean }
  | { document: Buffer | Uint8Array; mimetype?: string; fileName?: string }
  | { sticker: Buffer | Uint8Array }
  | { contact: { fullName: string; vcard: string } }
  | {
      location: {
        degreesLatitude: number;
        degreesLongitude: number;
        name?: string;
        address?: string;
      };
    }
  | { react: { text: string; key: WAMessageKey } };

export type MessageGenerationOptions = {
  timestamp?: number;
  userJid?: string;
  quoted?: WAMessage;
  ephemeralExpiration?: number;
  messageId?: string;
};

export type WAMessageSendOptions = MessageGenerationOptions & { messageId?: string };
