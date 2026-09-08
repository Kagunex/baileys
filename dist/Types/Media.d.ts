/**
 * Media download / upload types.
 */
export type DownloadableMessage = {
    url?: string;
    mediaUrl?: string;
    directPath?: string;
    mediaKey?: Uint8Array | Buffer;
    mimetype?: string;
    fileSha256?: Uint8Array | Buffer;
    fileEncSha256?: Uint8Array | Buffer;
    fileLength?: number;
    [key: string]: unknown;
};
export type MediaDownloadOptions = {
    startByte?: number;
    endByte?: number;
    /** Override download host */
    downloadUrl?: string;
};
export type MediaUploadResult = {
    /** Local encryption artifacts */
    mediaKey: Buffer | Uint8Array;
    fileEncSha256: Buffer | Uint8Array;
    fileSha256: Buffer | Uint8Array;
    fileLength: number;
    mimetype?: string;
    fileName?: string;
    /** Present only when an upload URL was provided and upload succeeded */
    url?: string;
    mediaUrl?: string;
    directPath?: string;
};
//# sourceMappingURL=Media.d.ts.map