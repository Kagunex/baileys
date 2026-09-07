/**
 * Typing / presence chatstate stanzas.
 */
import type { BinaryNode } from "../WABinary/types.js";
export type ChatState = "composing" | "paused" | "recording" | "available" | "unavailable";
/** WhatsApp-style chatstate for typing indicators */
export declare function buildChatstateNode(jid: string, state: "composing" | "paused" | "recording"): {
    encoded: Buffer;
    node: BinaryNode;
};
export declare function buildPresenceNode(type: "available" | "unavailable" | "composing" | "recording" | "paused", to?: string): {
    encoded: Buffer;
    node: BinaryNode;
};
//# sourceMappingURL=chatstate.d.ts.map