/**
 * sendMessage entry — delegates to Message Engine pipeline for true E2E path.
 *
 * Pipeline:
 *  1. generateWAMessage
 *  2. protobuf serialize
 *  3. optional Signal encrypt
 *  4. WABinary <message> node
 *  5. NoiseSession.seal → transport
 *  6. optional server ACK wait
 *  7. messages.upsert (+ messages.update on ACK)
 */
import { createMessageEngine } from "./engine.js";
/**
 * Public send helper used by tests and thin callers.
 * Prefer sock.sendMessage which uses a long-lived engine.
 */
export async function sendMessage(jid, content, options = {}, ctx) {
    const engine = ctx?.engine ??
        createMessageEngine({
            ev: ctx?.ev,
            userJid: ctx?.userJid ?? options.userJid,
            waitForAck: ctx?.waitForAck ?? !!ctx?.session,
        });
    if (!ctx?.ev && !ctx?.engine) {
        throw new Error("sendMessage requires ctx.ev or ctx.engine");
    }
    const net = ctx?.session && ctx.sendFrame
        ? { session: ctx.session, sendFrame: ctx.sendFrame }
        : undefined;
    try {
        return await engine.sendMessage(jid, content, { ...options, userJid: options.userJid ?? ctx?.userJid }, net, ctx?.signalSession, ctx?.onSignalSessionUpdate);
    }
    finally {
        // Only dispose ephemeral engines
        if (!ctx?.engine) {
            engine.dispose();
        }
    }
}
//# sourceMappingURL=send.js.map