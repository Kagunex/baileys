
export type MediaType = "image" | "video" | "audio" | "document" | "sticker" | "thumbnail-link" | "product";
export type MediaDownloadOptions = { startByte?: number; endByte?: number };
export type MediaUploadResult = { mediaUrl?: string; directPath?: string; mediaKey?: Uint8Array; fileEncSha256?: Uint8Array; fileSha256?: Uint8Array; fileLength?: number };
export type DownloadableMessage = { mediaKey?: Uint8Array | null; directPath?: string | null; url?: string | null; mimetype?: string | null; fileEncSha256?: Uint8Array | null; fileSha256?: Uint8Array | null; fileLength?: number | null };
