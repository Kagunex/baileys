/**
 * Typing / presence chatstate stanzas.
 */
import { encodeBinaryNode } from "../WABinary/encode.js";
/** WhatsApp-style chatstate for typing indicators */
export function buildChatstateNode(jid, state) {
    const node = {
        tag: "chatstate",
        attrs: { to: jid },
        content: [{ tag: state, attrs: {} }],
    };
    return { node, encoded: encodeBinaryNode(node) };
}
export function buildPresenceNode(type, to) {
    const node = {
        tag: "presence",
        attrs: {
            type,
            ...(to ? { to } : {}),
        },
    };
    return { node, encoded: encodeBinaryNode(node) };
}
//# sourceMappingURL=chatstate.js.map