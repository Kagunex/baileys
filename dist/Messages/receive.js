/**
 * receive path — thin wrapper around Message Engine handlePayload.
 */
import { normalizeMessage } from "./normalize.js";
import { parseMessageNode, isMessageNodePayload, } from "../Protocol/message-node.js";
import { createMessageEngine } from "./engine.js";
/**
 * Handle decrypted binary payload from Noise session.
 */
export function handleIncomingPayload(payload, ev, ctx) {
    const engine = ctx?.engine ??
        createMessageEngine({ ev, waitForAck: false });
    const net = ctx?.session && ctx.sendFrame
        ? { session: ctx.session, sendFrame: ctx.sendFrame }
        : undefined;
    let last;
    const onUpsert = (u) => {
        last = u.messages[0];
    };
    ev.on("messages.upsert", onUpsert);
    try {
        engine.handlePayload(payload, ctx?.signalSession, ctx?.onSignalSessionUpdate, net);
    }
    finally {
        ev.off("messages.upsert", onUpsert);
        if (!ctx?.engine)
            engine.dispose();
    }
    if (last)
        return last;
    // fallback parse without engine side-effects already done
    if (isMessageNodePayload(payload)) {
        const raw = parseMessageNode(payload);
        if (raw)
            return normalizeMessage(raw);
    }
    return undefined;
}
export function handleIncomingMessage(raw, ev) {
    const normalized = normalizeMessage(raw);
    ev.emit("messages.upsert", { messages: [normalized], type: "notify" });
    return normalized;
}
//# sourceMappingURL=receive.js.map