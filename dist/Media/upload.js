import { createHash, randomBytes } from "node:crypto";
import { NotImplementedError } from "../Errors/errors.js";
import { encryptMedia } from "./encrypt.js";
/**
 * Encrypt media and optionally POST to a provided upload URL.
 * Without uploadUrl, returns local encryption artifacts only (no fake CDN URL).
 */
export async function uploadMedia(data, mimeTypeOrOpts = "application/octet-stream") {
    const opts = typeof mimeTypeOrOpts === "string"
        ? { mimetype: mimeTypeOrOpts }
        : mimeTypeOrOpts;
    const plain = Buffer.from(data);
    const enc = encryptMedia(plain);
    const fileSha256 = createHash("sha256").update(plain).digest();
    const result = {
        mediaKey: new Uint8Array(enc.mediaKey),
        fileSha256: new Uint8Array(fileSha256),
        fileEncSha256: new Uint8Array(enc.fileEncSha256),
        fileLength: plain.length,
    };
    if (!opts.uploadUrl) {
        return result;
    }
    // Authenticated WA CDN tokens are not implemented — plain POST only if URL given
    try {
        const res = await fetch(opts.uploadUrl, {
            method: "POST",
            headers: {
                "Content-Type": opts.mimetype || "application/octet-stream",
                "User-Agent": "KaguneX-Baileys/1.5",
            },
            body: new Uint8Array(enc.ciphertext),
        });
        if (!res.ok) {
            throw new Error(`upload HTTP ${res.status}`);
        }
        // Best-effort parse location
        const loc = res.headers.get("location") || opts.uploadUrl;
        result.mediaUrl = loc;
        try {
            const u = new URL(loc);
            result.directPath = u.pathname + u.search;
        }
        catch {
            /* ignore */
        }
        return result;
    }
    catch (err) {
        throw new NotImplementedError(`media CDN upload failed (auth tokens not implemented): ${err.message}`);
    }
}
/** Generate random media key (32 bytes) for custom pipelines */
export function generateMediaKey() {
    return randomBytes(32);
}
//# sourceMappingURL=upload.js.map