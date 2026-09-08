import type { DownloadableMessage, MediaDownloadOptions } from "../Types/Media.js";
/**
 * Download media via HTTPS. Retries once on network failure.
 * Decrypts when mediaKey present (offline key).
 */
export declare function downloadMediaMessage(message: DownloadableMessage, options?: MediaDownloadOptions): Promise<Buffer>;
//# sourceMappingURL=download.d.ts.map