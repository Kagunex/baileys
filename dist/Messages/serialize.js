/**
 * Proper message serialization / deserialization (JSON-safe + binary protobuf).
 */
import { encodeWaMessageContent, decodeWaMessageContent } from "../WAProto/message.js";
export function serializeMessage(msg) {
    let messageProto;
    if (msg.message) {
        try {
            messageProto = encodeWaMessageContent(msg.message).toString("base64");
        }
        catch {
            messageProto = undefined;
        }
    }
    return {
        key: { ...msg.key },
        messageTimestamp: msg.messageTimestamp,
        status: msg.status,
        pushName: msg.pushName,
        messageStubType: msg.messageStubType,
        messageProto,
        message: msg.message ?? null,
    };
}
export function deserializeMessage(data) {
    let message = data.message ?? null;
    if (data.messageProto) {
        try {
            message = decodeWaMessageContent(Buffer.from(data.messageProto, "base64"));
        }
        catch {
            /* keep structured message */
        }
    }
    return {
        key: { ...data.key },
        messageTimestamp: data.messageTimestamp,
        status: data.status,
        pushName: data.pushName,
        messageStubType: data.messageStubType,
        message: message ?? null,
    };
}
/** Binary protobuf only (content body). */
export function serializeMessageContent(content) {
    return encodeWaMessageContent(content);
}
export function deserializeMessageContent(buf) {
    return decodeWaMessageContent(buf);
}
//# sourceMappingURL=serialize.js.map