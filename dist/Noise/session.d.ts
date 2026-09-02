/**
 * Post-handshake Noise transport session (WhatsApp-style frames).
 *
 * Frame: 3-byte big-endian length || AES-256-GCM(ciphertext || tag)
 * Nonce: Noise standard 12-byte (4 zero + 8 BE counter)
 */
import { type NoiseHandshakeResult } from "./handshake.js";
export declare class NoiseSession {
    private sendKey;
    private recvKey;
    private writeNonce;
    private readNonce;
    private rxBuffer;
    readonly remoteStaticPublic?: Buffer;
    readonly handshakeHash: Buffer;
    constructor(keys: NoiseHandshakeResult);
    /** Encrypt plaintext and wrap in length-prefixed frame. */
    seal(plaintext: Buffer): Buffer;
    /**
     * Feed raw socket bytes; returns decrypted payloads (0+).
     */
    open(chunk: Buffer): Buffer[];
    get writeCounter(): bigint;
    get readCounter(): bigint;
}
//# sourceMappingURL=session.d.ts.map