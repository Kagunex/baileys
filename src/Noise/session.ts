/**
 * Post-handshake Noise transport session (WhatsApp-style frames).
 *
 * Frame: 3-byte big-endian length || AES-256-GCM(ciphertext || tag)
 * Nonce: Noise standard 12-byte (4 zero + 8 BE counter)
 */

import { encodeFrame, decodeFrame } from "../WABinary/frame.js";
import {
  noiseEncrypt,
  noiseDecrypt,
  type NoiseHandshakeResult,
} from "./handshake.js";

export class NoiseSession {
  private sendKey: Buffer;
  private recvKey: Buffer;
  private writeNonce: bigint;
  private readNonce: bigint;
  private rxBuffer: Buffer = Buffer.alloc(0);
  readonly remoteStaticPublic?: Buffer;
  readonly handshakeHash: Buffer;

  constructor(keys: NoiseHandshakeResult) {
    this.sendKey = keys.sendKey;
    this.recvKey = keys.recvKey;
    this.writeNonce = keys.writeNonce;
    this.readNonce = keys.readNonce;
    this.remoteStaticPublic = keys.remoteStaticPublic;
    this.handshakeHash = keys.handshakeHash ?? Buffer.alloc(0);
  }

  /** Encrypt plaintext and wrap in length-prefixed frame. */
  seal(plaintext: Buffer): Buffer {
    const ct = noiseEncrypt(this.sendKey, this.writeNonce, plaintext);
    this.writeNonce += 1n;
    return encodeFrame(ct);
  }

  /**
   * Feed raw socket bytes; returns decrypted payloads (0+).
   */
  open(chunk: Buffer): Buffer[] {
    this.rxBuffer = Buffer.concat([this.rxBuffer, chunk]);
    const out: Buffer[] = [];
    while (true) {
      const decoded = decodeFrame(this.rxBuffer);
      if (!decoded) break;
      this.rxBuffer = decoded.rest;
      const pt = noiseDecrypt(this.recvKey, this.readNonce, decoded.payload);
      this.readNonce += 1n;
      out.push(pt);
    }
    return out;
  }

  get writeCounter(): bigint {
    return this.writeNonce;
  }

  get readCounter(): bigint {
    return this.readNonce;
  }
}
