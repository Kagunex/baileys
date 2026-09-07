import type { MediaUploadResult } from "../Types/Media.js";
export type MediaUploadOptions = {
    /** Optional CDN upload URL (when obtained from server) */
    uploadUrl?: string;
    mimetype?: string;
    fileName?: string;
};
/**
 * Encrypt media and optionally POST to a provided upload URL.
 * Without uploadUrl, returns local encryption artifacts only (no fake CDN URL).
 */
export declare function uploadMedia(data: Buffer | Uint8Array, mimeTypeOrOpts?: string | MediaUploadOptions): Promise<MediaUploadResult>;
/** Generate random media key (32 bytes) for custom pipelines */
export declare function generateMediaKey(): Buffer;
//# sourceMappingURL=upload.d.ts.map