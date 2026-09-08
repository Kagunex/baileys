/**
 * Server ACK / receipt parsing and pending ACK waiters.
 */
import { decodeBinaryNode } from "../WABinary/decode.js";
import { getBinaryNodeAttr, getBinaryNodeChildren, } from "../WABinary/index.js";
import { encodeBinaryNode } from "../WABinary/encode.js";
import { generateMessageID } from "../Utils/generics.js";
export function parseReceiptNode(payload) {
    try {
        const node = decodeBinaryNode(payload);
        return extractReceipts(node);
    }
    catch {
        return [];
    }
}
function mapType(t) {
    if (!t)
        return "server";
    if (t === "delivery" || t === "receiver")
        return "delivery";
    if (t === "read")
        return "read";
    if (t === "played")
        return "played";
    if (t === "server-ack" || t === "inactive" || t === "server")
        return "server";
    return "unknown";
}
function extractReceipts(node) {
    const out = [];
    if (node.tag === "ack") {
        const id = getBinaryNodeAttr(node, "id");
        if (id) {
            out.push({
                id,
                remoteJid: getBinaryNodeAttr(node, "from") || getBinaryNodeAttr(node, "to"),
                type: mapType(getBinaryNodeAttr(node, "class") || getBinaryNodeAttr(node, "type")),
                timestamp: Number(getBinaryNodeAttr(node, "t")) || undefined,
            });
        }
    }
    if (node.tag === "receipt") {
        const remoteJid = getBinaryNodeAttr(node, "from") || getBinaryNodeAttr(node, "to");
        const participant = getBinaryNodeAttr(node, "participant");
        const type = mapType(getBinaryNodeAttr(node, "type"));
        const t = Number(getBinaryNodeAttr(node, "t")) || undefined;
        // children list of item ids
        const items = getBinaryNodeChildren(node, "list").length
            ? getBinaryNodeChildren(getBinaryNodeChildren(node, "list")[0], "item")
            : getBinaryNodeChildren(node, "item");
        if (items.length) {
            for (const item of items) {
                const id = getBinaryNodeAttr(item, "id");
                if (id)
                    out.push({ id, remoteJid, participant, type, timestamp: t });
            }
        }
        else {
            const id = getBinaryNodeAttr(node, "id");
            if (id)
                out.push({ id, remoteJid, participant, type, timestamp: t });
        }
    }
    return out;
}
export function isAckOrReceiptPayload(payload) {
    try {
        const tag = decodeBinaryNode(payload).tag;
        return tag === "ack" || tag === "receipt";
    }
    catch {
        return false;
    }
}
/** Build receipt stanza we send to server (client ACK for incoming). */
export function buildReceiptNode(opts) {
    const node = {
        tag: "receipt",
        attrs: {
            to: opts.to,
            id: opts.ids[0] || generateMessageID(),
            ...(opts.type ? { type: opts.type } : {}),
            ...(opts.participant ? { participant: opts.participant } : {}),
            t: String(Math.floor(Date.now() / 1000)),
        },
        content: opts.ids.length > 1
            ? opts.ids.map((id) => ({ tag: "item", attrs: { id } }))
            : undefined,
    };
    return { encoded: encodeBinaryNode(node) };
}
/** Pending server-ACK waiters keyed by message id */
export class AckWaiter {
    waiters = new Map();
    wait(id, timeoutMs = 30_000) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                this.waiters.delete(id);
                reject(new Error(`ACK timeout for message ${id}`));
            }, timeoutMs);
            this.waiters.set(id, { resolve, reject, timer });
        });
    }
    handle(receipts) {
        for (const r of receipts) {
            const w = this.waiters.get(r.id);
            if (!w)
                continue;
            clearTimeout(w.timer);
            this.waiters.delete(r.id);
            w.resolve(r);
        }
    }
    cancelAll(reason = "ack cancelled") {
        for (const [, w] of this.waiters) {
            clearTimeout(w.timer);
            w.reject(new Error(reason));
        }
        this.waiters.clear();
    }
}
//# sourceMappingURL=ack.js.map