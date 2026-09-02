/**
 * Message stanza builders/parsers — protobuf Message content when possible.
 */
import type { BinaryNode } from "../WABinary/types.js";
import { encodeTextMessagePayload } from "../WAProto/message-codec.js";
import type { WAMessage, WAMessageContent } from "../Types/Messages.js";
export declare function buildMessageNode(opts: {
    to: string;
    content: WAMessageContent;
    id?: string;
    participant?: string;
    /** raw body override (e.g. signal-encrypted) */
    body?: Buffer;
}): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildTextMessageNode(opts: {
    to: string;
    text: string;
    id?: string;
    participant?: string;
}): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function parseMessageNode(payload: Buffer): WAMessage | undefined;
export declare function isMessageNodePayload(payload: Buffer): boolean;
/** @deprecated use protobuf path; kept for tests */
export { encodeTextMessagePayload };
//# sourceMappingURL=message-node.d.ts.map