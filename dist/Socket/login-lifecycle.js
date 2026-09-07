/**
 * Login lifecycle helpers — QR / Pairing / registered session / loggedOut.
 * PRIORITY #1 for KaguneX Baileys.
 */
import { parseProtocolPayload } from "../Protocol/handler.js";
import { composeQrPayload } from "../Protocol/handler.js";
import { decodeBinaryNode } from "../WABinary/decode.js";
import { getBinaryNodeAttr, getBinaryNodeChild } from "../WABinary/index.js";
/** WA-style disconnect status codes (public knowledge). */
export const DisconnectStatus = {
    loggedOut: 401,
    forbidden: 403,
    timedOut: 408,
    multideviceMismatch: 411,
    connectionReplaced: 440,
    badSession: 500,
    restartRequired: 515,
};
export function resolveLoginMode(creds) {
    if (!creds)
        return "unknown";
    if (creds.registered && creds.me?.id)
        return "registered";
    if (creds.pairingCode)
        return "pairing";
    return "qr";
}
/**
 * Detect logged-out / fatal stream errors from decrypted payload.
 */
export function detectDisconnectFromPayload(payload) {
    // Pairing / protocol parse first
    try {
        const node = decodeBinaryNode(payload);
        if (node.tag === "stream:error" || node.tag === "error") {
            const code = getBinaryNodeAttr(node, "code");
            const text = getBinaryNodeAttr(node, "text") || getBinaryNodeAttr(node, "title");
            return classifyStreamError(code, text);
        }
        if (node.tag === "iq" && getBinaryNodeAttr(node, "type") === "error") {
            const err = getBinaryNodeChild(node, "error");
            const code = (err && getBinaryNodeAttr(err, "code")) || getBinaryNodeAttr(node, "code");
            const text = (err && getBinaryNodeAttr(err, "text")) || undefined;
            return classifyStreamError(code, text);
        }
        // <failure reason="...">
        if (node.tag === "failure") {
            const reason = getBinaryNodeAttr(node, "reason") || getBinaryNodeAttr(node, "code");
            return classifyStreamError(reason, reason);
        }
    }
    catch {
        /* not a node */
    }
    const parsed = parseProtocolPayload(payload);
    if (parsed.streamError) {
        return classifyStreamError(parsed.streamError, parsed.streamError);
    }
    return undefined;
}
export function classifyStreamError(code, text) {
    const c = (code || "").toLowerCase();
    const t = (text || "").toLowerCase();
    const num = Number(code);
    if (num === 401 ||
        c === "401" ||
        t.includes("logged out") ||
        t.includes("logged_out") ||
        c === "logout" ||
        c === "logged_out") {
        return {
            code: DisconnectStatus.loggedOut,
            statusCode: DisconnectStatus.loggedOut,
            message: text || "logged out",
            isLoggedOut: true,
        };
    }
    if (num === 440 || c === "440" || t.includes("replaced") || c === "connection_replaced") {
        return {
            code: DisconnectStatus.connectionReplaced,
            statusCode: DisconnectStatus.connectionReplaced,
            message: text || "connection replaced",
            isLoggedOut: false,
        };
    }
    if (num === 403 || c === "403") {
        return {
            code: DisconnectStatus.forbidden,
            statusCode: DisconnectStatus.forbidden,
            message: text || "forbidden",
            isLoggedOut: false,
        };
    }
    if (num === 408 || c === "408" || t.includes("timeout")) {
        return {
            code: DisconnectStatus.timedOut,
            statusCode: DisconnectStatus.timedOut,
            message: text || "timed out",
            isLoggedOut: false,
        };
    }
    if (num === 515 || c === "515" || t.includes("restart")) {
        return {
            code: DisconnectStatus.restartRequired,
            statusCode: DisconnectStatus.restartRequired,
            message: text || "restart required",
            isLoggedOut: false,
        };
    }
    return {
        code: num || undefined,
        statusCode: Number.isFinite(num) ? num : undefined,
        message: text || code || "stream error",
        isLoggedOut: false,
    };
}
/**
 * Apply pair-success / login success onto creds.
 *
 * Requires an explicit pair-success signal AND a valid device identity (JID).
 * A pairing *code* alone must never open the connection.
 * Malformed / incomplete pair-success frames are rejected.
 */
export function applyPairSuccess(pairing, existing) {
    // Explicit pair-success is mandatory — do not treat "me" alone as success
    if (pairing.pairSuccess !== true)
        return undefined;
    const me = pairing.me;
    // Device identity from the pair-success frame is required
    if (!me?.id || typeof me.id !== "string")
        return undefined;
    // Minimal JID shape: user@server (e.g. 628xxx@s.whatsapp.net)
    if (!me.id.includes("@") || me.id.length < 5)
        return undefined;
    // When local creds exist, require core key material so we do not "open"
    // without a usable auth state (prevents open-on-empty-creds)
    if (existing) {
        const hasNoise = existing.noiseKey?.public?.length && existing.noiseKey?.private?.length;
        const hasIdentity = existing.signedIdentityKey?.public?.length &&
            existing.signedIdentityKey?.private?.length;
        if (!hasNoise || !hasIdentity)
            return undefined;
    }
    return {
        credsPatch: {
            me: { id: me.id, name: me.name ?? existing?.me?.name },
            registered: true,
            pairingCode: undefined,
        },
        connectionUpdate: {
            connection: "open",
            isNewLogin: true,
        },
    };
}
/**
 * Build QR string only when server ref is real + local keys exist.
 */
export function buildQrFromServerRef(ref, creds) {
    return composeQrPayload({
        ref,
        noisePub: Buffer.from(creds.noiseKey.public),
        identityPub: Buffer.from(creds.signedIdentityKey.public),
        advSecretKey: creds.advSecretKey,
    });
}
/**
 * After successful login, session should reconnect without pairing.
 */
export function shouldSkipPairingOnReconnect(creds) {
    return resolveLoginMode(creds) === "registered";
}
/**
 * Clear registration on logged-out (caller should persist via saveCreds).
 */
export function applyLoggedOut(creds) {
    return {
        registered: false,
        me: undefined,
        pairingCode: undefined,
    };
}
//# sourceMappingURL=login-lifecycle.js.map