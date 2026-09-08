/**
 * Message Engine — full client-side E2E pipeline:
 * generate → protobuf → (optional Signal) → WABinary node → Noise seal → send
 * receive: Noise open → receipt/ACK | message node → decrypt → upsert
 */
import { generateWAMessage } from "./generate.js";
import { normalizeMessage } from "./normalize.js";
import { MessageError, NotImplementedError } from "../Errors/errors.js";
import { buildMessageNode, parseMessageNode, isMessageNodePayload, } from "../Protocol/message-node.js";
import { signalEncrypt, signalDecrypt } from "../Signal/session.js";
import { encodeSignalWire, decodeSignalWire, wrapEncryptedBody, unwrapEncryptedBody, } from "../Signal/wire.js";
import { MessageDeduper } from "./dedup.js";
import { withRetry } from "./retry.js";
import { AckWaiter, parseReceiptNode, isAckOrReceiptPayload, buildReceiptNode, } from "./ack.js";
import { decodeBinaryNode } from "../WABinary/decode.js";
import { getBinaryNodeAttr } from "../WABinary/index.js";
import { generateMessageID } from "../Utils/generics.js";
import { serializeMessageContent, deserializeMessageContent, } from "./serialize.js";
function statusFromReceipt(type) {
    // WA-like: 0 error, 1 pending, 2 server, 3 delivery, 4 read
    if (type === "read")
        return 4;
    if (type === "delivery")
        return 3;
    if (type === "server")
        return 2;
    return 2;
}
export function createMessageEngine(opts) {
    const deduper = new MessageDeduper();
    const acks = new AckWaiter();
    const { ev, logger } = opts;
    const emitUpsert = (msg, type = "notify") => {
        const normalized = normalizeMessage(msg);
        const id = normalized.key.id || "";
        const jid = normalized.key.remoteJid || "";
        if (id && !deduper.checkAndAdd(jid, id, normalized.key.fromMe ?? undefined)) {
            logger?.debug({ id }, "dedup skip upsert");
            return normalized;
        }
        ev.emit("messages.upsert", { messages: [normalized], type });
        return normalized;
    };
    const emitUpdate = (key, update) => {
        ev.emit("messages.update", [{ key, update }]);
    };
    const buildOutboundFrame = (jid, msg, signalSession, onSignalUpdate) => {
        const content = msg.message || { conversation: "" };
        // Always go through protobuf serialize for wire body
        let body = serializeMessageContent(content);
        if (signalSession) {
            const { session: next, message: sealed } = signalEncrypt(signalSession, body);
            onSignalUpdate?.(next);
            body = wrapEncryptedBody({ signalWire: encodeSignalWire(sealed) });
        }
        const { encoded } = buildMessageNode({
            to: jid,
            content,
            id: msg.key.id ?? undefined,
            participant: msg.key.participant ?? undefined,
            body,
        });
        return { nodeEncoded: encoded, msg };
    };
    async function sendRaw(jid, msg, net, signalSession, onSignalUpdate) {
        if (!net) {
            emitUpsert(msg);
            if (process.env.KAGUNEX_STRICT_SEND === "1") {
                throw new NotImplementedError("sendMessage requires active Noise session (set KAGUNEX_STRICT_SEND=0 for local-only)");
            }
            return msg;
        }
        const { nodeEncoded } = buildOutboundFrame(jid, msg, signalSession, onSignalUpdate);
        await withRetry(async () => {
            const frame = net.session.seal(nodeEncoded);
            net.sendFrame(frame);
        }, { maxAttempts: opts.maxSendAttempts ?? 3, baseDelayMs: 300 });
        emitUpsert(msg);
        if (opts.waitForAck !== false && msg.key.id) {
            try {
                const receipt = await acks.wait(msg.key.id, opts.ackTimeoutMs ?? 30_000);
                logger?.debug({ id: msg.key.id, type: receipt.type }, "server ACK");
                const status = statusFromReceipt(receipt.type);
                msg = { ...msg, status };
                emitUpdate(msg.key, { status });
            }
            catch (err) {
                logger?.warn({ err, id: msg.key.id }, "ACK wait failed — frame already sent");
            }
        }
        return msg;
    }
    async function sendMessage(jid, content, options = {}, net, signalSession, onSignalUpdate) {
        const msg = generateWAMessage(jid, content, {
            ...options,
            userJid: options.userJid ?? opts.userJid,
            quoted: options.quoted || ("quoted" in content ? content.quoted : undefined),
        });
        try {
            return await sendRaw(msg.key.remoteJid || jid, msg, net, signalSession, onSignalUpdate);
        }
        catch (err) {
            throw new MessageError("sendMessage failed", { cause: err });
        }
    }
    function handleIncomingMessageNode(payload, signalSession, onSignalUpdate, net) {
        try {
            const node = decodeBinaryNode(payload);
            if (node.tag !== "message")
                return;
            const remoteJid = getBinaryNodeAttr(node, "from") || getBinaryNodeAttr(node, "to") || "";
            const id = getBinaryNodeAttr(node, "id") || "";
            const participant = getBinaryNodeAttr(node, "participant");
            const fromMe = getBinaryNodeAttr(node, "fromMe") === "true";
            let content;
            if (Buffer.isBuffer(node.content) || node.content instanceof Uint8Array) {
                const body = Buffer.from(node.content);
                if (signalSession &&
                    body.length > 5 &&
                    body.subarray(1, 5).toString("utf-8") === "KXS1") {
                    const { signalWire } = unwrapEncryptedBody(body);
                    const wire = decodeSignalWire(signalWire);
                    const { session, plaintext } = signalDecrypt(signalSession, wire);
                    onSignalUpdate?.(session);
                    content = deserializeMessageContent(plaintext);
                }
                else {
                    try {
                        content = deserializeMessageContent(body);
                    }
                    catch {
                        content = parseMessageNode(payload)?.message;
                    }
                }
            }
            else {
                content = parseMessageNode(payload)?.message;
            }
            const msg = {
                key: { remoteJid, id, fromMe, participant },
                message: content ?? null,
                messageTimestamp: Math.floor(Date.now() / 1000),
            };
            if (content?.protocolMessage) {
                const pm = content.protocolMessage;
                if (pm.type === 0 && pm.key) {
                    ev.emit("messages.delete", { keys: [pm.key] });
                    emitUpdate(pm.key, { message: null, messageStubType: 1 });
                }
                else if (pm.type === 14 && pm.key) {
                    emitUpdate(pm.key, { message: content });
                }
            }
            if (content?.reactionMessage?.key) {
                ev.emit("messages.reaction", [
                    {
                        key: content.reactionMessage.key,
                        reaction: {
                            text: content.reactionMessage.text,
                            key: content.reactionMessage.key,
                        },
                    },
                ]);
            }
            emitUpsert(msg);
            if (!fromMe && net && id && remoteJid) {
                try {
                    const { encoded } = buildReceiptNode({
                        to: remoteJid,
                        ids: [id],
                        participant,
                    });
                    net.sendFrame(net.session.seal(encoded));
                }
                catch (err) {
                    logger?.trace({ err }, "client receipt send failed");
                }
            }
        }
        catch (err) {
            logger?.debug({ err }, "handleIncomingMessageNode failed");
        }
    }
    function handlePayload(payload, signalSession, onSignalUpdate, net) {
        if (isAckOrReceiptPayload(payload)) {
            const receipts = parseReceiptNode(payload);
            if (receipts.length) {
                acks.handle(receipts);
                for (const r of receipts) {
                    emitUpdate({
                        id: r.id,
                        remoteJid: r.remoteJid,
                        participant: r.participant,
                        fromMe: true,
                    }, { status: statusFromReceipt(r.type) });
                }
            }
            return;
        }
        if (isMessageNodePayload(payload)) {
            handleIncomingMessageNode(payload, signalSession, onSignalUpdate, net);
        }
    }
    return {
        sendMessage,
        handlePayload,
        buildOutboundFrame,
        sendReaction: async (key, text, net) => {
            const jid = key.remoteJid || "";
            const msg = {
                key: { remoteJid: jid, fromMe: true, id: generateMessageID() },
                message: { reactionMessage: { key, text } },
                messageTimestamp: Math.floor(Date.now() / 1000),
            };
            const sent = await sendRaw(jid, msg, net);
            ev.emit("messages.reaction", [{ key, reaction: { text, key } }]);
            return sent;
        },
        sendRevoke: async (key, net) => {
            const jid = key.remoteJid || "";
            const msg = {
                key: { remoteJid: jid, fromMe: true, id: generateMessageID() },
                message: { protocolMessage: { key, type: 0 } },
                messageTimestamp: Math.floor(Date.now() / 1000),
            };
            return sendRaw(jid, msg, net);
        },
        sendEdit: async (key, newText, net) => {
            const jid = key.remoteJid || "";
            const msg = {
                key: { remoteJid: jid, fromMe: true, id: generateMessageID() },
                message: {
                    protocolMessage: { key, type: 14 },
                    extendedTextMessage: { text: newText },
                },
                messageTimestamp: Math.floor(Date.now() / 1000),
            };
            return sendRaw(jid, msg, net);
        },
        deduper,
        acks,
        dispose: () => {
            acks.cancelAll();
            deduper.clear();
        },
    };
}
//# sourceMappingURL=engine.js.map