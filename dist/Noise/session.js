/**
 * Post-handshake Noise transport session (WhatsApp-style frames).
 *
 * Frame: 3-byte big-endian length || AES-256-GCM(ciphertext || tag)
 * Nonce: Noise standard 12-byte (4 zero + 8 BE counter)
 */
import { encodeFrame, decodeFrame } from "../WABinary/frame.js";
import { noiseEncrypt, noiseDecrypt, } from "./handshake.js";
export class NoiseSession {
    sendKey;
    recvKey;
    writeNonce;
    readNonce;
    rxBuffer = Buffer.alloc(0);
    remoteStaticPublic;
    handshakeHash;
    constructor(keys) {
        this.sendKey = keys.sendKey;
        this.recvKey = keys.recvKey;
        this.writeNonce = keys.writeNonce;
        this.readNonce = keys.readNonce;
        this.remoteStaticPublic = keys.remoteStaticPublic;
        this.handshakeHash = keys.handshakeHash ?? Buffer.alloc(0);
    }
    /** Encrypt plaintext and wrap in length-prefixed frame. */
    seal(plaintext) {
        const ct = noiseEncrypt(this.sendKey, this.writeNonce, plaintext);
        this.writeNonce += 1n;
        return encodeFrame(ct);
    }
    /**
     * Feed raw socket bytes; returns decrypted payloads (0+).
     */
    open(chunk) {
        this.rxBuffer = Buffer.concat([this.rxBuffer, chunk]);
        const out = [];
        while (true) {
            const decoded = decodeFrame(this.rxBuffer);
            if (!decoded)
                break;
            this.rxBuffer = decoded.rest;
            const pt = noiseDecrypt(this.recvKey, this.readNonce, decoded.payload);
            this.readNonce += 1n;
            out.push(pt);
        }
        return out;
    }
    get writeCounter() {
        return this.writeNonce;
    }
    get readCounter() {
        return this.readNonce;
    }
}
//# sourceMappingURL=session.js.map