import { createHash } from "node:crypto";
import { toBuffer } from "../Utils/buffers.js";
import { MediaError } from "../Errors/errors.js";
export function validateMimeType(mime) {
    if (!mime)
        throw new MediaError("MIME type is required");
    if (!["image/", "video/", "audio/", "application/", "text/"].some((p) => mime.startsWith(p))) {
        throw new MediaError(`Unsupported MIME type: ${mime}`);
    }
    return mime;
}
export function sha256File(data) {
    return createHash("sha256").update(toBuffer(data)).digest();
}
export function extensionFromMime(mime) {
    const map = {
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/webp": "webp",
        "video/mp4": "mp4",
        "audio/ogg": "ogg",
        "audio/mpeg": "mp3",
        "application/pdf": "pdf",
    };
    return map[mime] || "bin";
}
//# sourceMappingURL=utils.js.map