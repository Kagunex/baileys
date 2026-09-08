/**
 * Proper message serialization / deserialization (JSON-safe + binary protobuf).
 */
import type { WAMessage, WAMessageContent, WAMessageKey } from "../Types/Messages.js";
export type SerializedWAMessage = {
    key: WAMessageKey;
    messageTimestamp?: number | string | null;
    status?: number | string;
    pushName?: string | null;
    messageStubType?: number | null;
    /** base64 protobuf of message content when present */
    messageProto?: string;
    /** structured content mirror for debugging */
    message?: WAMessageContent | null;
};
export declare function serializeMessage(msg: WAMessage): SerializedWAMessage;
export declare function deserializeMessage(data: SerializedWAMessage): WAMessage;
/** Binary protobuf only (content body). */
export declare function serializeMessageContent(content: WAMessageContent): Buffer;
export declare function deserializeMessageContent(buf: Buffer): WAMessageContent;
//# sourceMappingURL=serialize.d.ts.map