export type EncryptedMedia = {
    ciphertext: Buffer;
    mediaKey: Buffer;
    fileSha256: Buffer;
    fileEncSha256: Buffer;
    mac: Buffer;
};
export declare function encryptMedia(plaintext: Buffer | Uint8Array): EncryptedMedia;
export declare function decryptMedia(ciphertextWithMac: Buffer | Uint8Array, mediaKey: Buffer | Uint8Array): Buffer;
//# sourceMappingURL=encrypt.d.ts.map