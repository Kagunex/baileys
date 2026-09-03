/**
 * Message types used by Messages/, Protocol/, Socket/.
 */
export type WAMessageKey = {
    remoteJid?: string | null;
    fromMe?: boolean | null;
    id?: string | null;
    participant?: string | null;
    [key: string]: unknown;
};
export type WAMessageContent = {
    conversation?: string;
    extendedTextMessage?: {
        text?: string;
        contextInfo?: unknown;
        [key: string]: unknown;
    };
    imageMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
        mediaKey?: Uint8Array | Buffer;
        fileSha256?: Uint8Array | Buffer;
        fileLength?: number | LongLike;
        [key: string]: unknown;
    };
    videoMessage?: {
        url?: string;
        mimetype?: string;
        caption?: string;
        mediaKey?: Uint8Array | Buffer;
        [key: string]: unknown;
    };
    audioMessage?: {
        url?: string;
        mimetype?: string;
        mediaKey?: Uint8Array | Buffer;
        ptt?: boolean;
        [key: string]: unknown;
    };
    documentMessage?: {
        url?: string;
        mimetype?: string;
        fileName?: string;
        mediaKey?: Uint8Array | Buffer;
        [key: string]: unknown;
    };
    stickerMessage?: {
        url?: string;
        mimetype?: string;
        mediaKey?: Uint8Array | Buffer;
        [key: string]: unknown;
    };
    locationMessage?: {
        degreesLatitude?: number;
        degreesLongitude?: number;
        name?: string;
        address?: string;
        [key: string]: unknown;
    };
    contactMessage?: {
        displayName?: string;
        vcard?: string;
        [key: string]: unknown;
    };
    reactionMessage?: {
        key?: WAMessageKey;
        text?: string;
        [key: string]: unknown;
    };
    protocolMessage?: {
        key?: WAMessageKey;
        type?: number | string;
        editedMessage?: WAMessageContent;
        [key: string]: unknown;
    };
    senderKeyDistributionMessage?: unknown;
    [key: string]: unknown;
};
type LongLike = number | {
    low: number;
    high: number;
    unsigned?: boolean;
};
export type WAMessage = {
    key: WAMessageKey;
    message?: WAMessageContent | null;
    messageTimestamp?: number | LongLike | null;
    status?: number | string;
    pushName?: string | null;
    participant?: string | null;
    broadcast?: boolean | null;
    messageStubType?: number | null;
    messageStubParameters?: string[] | null;
    [key: string]: unknown;
};
export type MessageGenerationOptions = {
    messageId?: string;
    timestamp?: number;
    userJid?: string;
    [key: string]: unknown;
};
export type WAMessageSendOptions = {
    /** Message ID override */
    messageId?: string;
    timestamp?: number;
    quoted?: WAMessage;
    ephemeralExpiration?: number;
    mediaUploadTimeoutMs?: number;
    statusJidList?: string[];
    backgroundColor?: string;
    font?: number;
    userJid?: string;
    [key: string]: unknown;
};
export type AnyMessageContent = {
    text: string;
    mentions?: string[];
    linkPreview?: unknown;
} | {
    react: {
        text: string;
        key: WAMessageKey;
    };
} | {
    image: Buffer | Uint8Array | {
        url: string;
    };
    caption?: string;
    mimetype?: string;
} | {
    video: Buffer | Uint8Array | {
        url: string;
    };
    caption?: string;
    mimetype?: string;
} | {
    audio: Buffer | Uint8Array | {
        url: string;
    };
    mimetype?: string;
    ptt?: boolean;
} | {
    document: Buffer | Uint8Array | {
        url: string;
    };
    mimetype?: string;
    fileName?: string;
} | {
    sticker: Buffer | Uint8Array | {
        url: string;
    };
    mimetype?: string;
} | {
    location: {
        degreesLatitude: number;
        degreesLongitude: number;
        name?: string;
        address?: string;
    };
} | {
    contact: {
        fullName?: string;
        vcard?: string;
    };
} | WAMessageContent;
export {};
//# sourceMappingURL=Messages.d.ts.map