import { MediaError, NotImplementedError } from "../Errors/errors.js";
import { decryptMedia } from "./encrypt.js";
const DEFAULT_HOST = "https://mmg.whatsapp.net";
function resolveUrl(message) {
    if (message.url)
        return message.url;
    if (message.directPath) {
        const path = message.directPath.startsWith("/")
            ? message.directPath
            : `/${message.directPath}`;
        return `${DEFAULT_HOST}${path}`;
    }
    return undefined;
}
/**
 * Download media via HTTPS. Retries once on network failure.
 * Decrypts when mediaKey present (offline key).
 */
export async function downloadMediaMessage(message, options) {
    const url = resolveUrl(message);
    if (!url) {
        throw new NotImplementedError("downloadMediaMessage: no url/directPath on message");
    }
    const headers = {
        "User-Agent": "KaguneX-Baileys/1.5",
        Accept: "*/*",
    };
    if (options?.startByte != null || options?.endByte != null) {
        const start = options.startByte ?? 0;
        const end = options.endByte ?? "";
        headers.Range = `bytes=${start}-${end}`;
    }
    let lastErr;
    for (let attempt = 1; attempt <= 2; attempt++) {
        try {
            const res = await fetch(url, { headers });
            if (!res.ok) {
                throw new MediaError(`media HTTP ${res.status}`);
            }
            const buf = Buffer.from(await res.arrayBuffer());
            if (message.mediaKey && message.mediaKey.length) {
                try {
                    return decryptMedia(buf, Buffer.from(message.mediaKey));
                }
                catch {
                    return buf;
                }
            }
            return buf;
        }
        catch (err) {
            lastErr = err;
            if (attempt === 2)
                break;
        }
    }
    throw lastErr instanceof Error
        ? lastErr
        : new MediaError("media download failed", { cause: lastErr });
}
//# sourceMappingURL=download.js.map