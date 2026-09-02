/**
 * Lightweight protocol router for post-Noise binary nodes.
 * Extracts actionable fields without inventing server data.
 */
import { decodeBinaryNode } from "../WABinary/decode.js";
import { getBinaryNodeAttr, getBinaryNodeChild, getBinaryNodeChildren, } from "../WABinary/index.js";
function collectQrRefs(node, out) {
    const ref = getBinaryNodeAttr(node, "ref");
    if (ref && ref.length > 8)
        out.push(ref);
    if (node.tag === "pair-device" || node.tag === "qr" || node.tag === "scan") {
        const r = getBinaryNodeAttr(node, "ref") || getBinaryNodeAttr(node, "code");
        if (r)
            out.push(r);
    }
    for (const c of getBinaryNodeChildren(node))
        collectQrRefs(c, out);
}
export function parseProtocolPayload(payload) {
    const qrRefs = [];
    const nodes = [];
    let streamError;
    let success = false;
    let pairSuccess = false;
    try {
        const node = decodeBinaryNode(payload);
        nodes.push(node);
        collectQrRefs(node, qrRefs);
        if (node.tag === "success")
            success = true;
        if (node.tag === "stream:error" || node.tag === "error") {
            streamError =
                getBinaryNodeAttr(node, "code") ||
                    getBinaryNodeAttr(node, "text") ||
                    "stream error";
        }
        if (node.tag === "pair-success" || getBinaryNodeChild(node, "pair-success")) {
            pairSuccess = true;
        }
        if (node.tag === "iq") {
            const type = getBinaryNodeAttr(node, "type");
            if (type === "error")
                streamError = getBinaryNodeAttr(node, "code") || "iq error";
            if (type === "result")
                success = true;
        }
    }
    catch {
        // not a single BinaryNode
    }
    return { nodes, qrRefs: [...new Set(qrRefs)], streamError, success, pairSuccess };
}
/**
 * Compose multi-device QR string from a real server ref + local keys.
 * Returns undefined if any piece is missing — never invents a ref.
 */
export function composeQrPayload(parts) {
    if (!parts.ref || parts.ref.length < 8)
        return undefined;
    if (!parts.noisePub?.length || !parts.identityPub?.length)
        return undefined;
    if (!parts.advSecretKey)
        return undefined;
    return `${parts.ref},${parts.noisePub.toString("base64")},${parts.identityPub.toString("base64")},${parts.advSecretKey}`;
}
//# sourceMappingURL=handler.js.map