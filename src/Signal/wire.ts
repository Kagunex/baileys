/**
 * Signal wire envelopes used on WhatsApp (simplified, KaguneX).
 *
 * Official mobile format uses protobuf WhisperMessage / PreKeyWhisperMessage.
 * We encode a compact versioned envelope compatible with our session ratchet:
 *
 *   magic "KXS1" | version u8 | counter u32be | ratchetPub(32) | ciphertext
 *
 * When full WA Signal protos are extracted into WAProto, map this layer over.
 */

import type { SignalCiphertext } from "./session.js";

export const SIGNAL_WIRE_MAGIC = Buffer.from("KXS1");

export function encodeSignalWire(message: SignalCiphertext): Buffer {
  const pub = message.ratchetPub;
  if (pub.length !== 32) throw new Error("ratchetPub must be 32 bytes");
  const header = Buffer.alloc(4 + 1 + 4 + 32);
  SIGNAL_WIRE_MAGIC.copy(header, 0);
  header.writeUInt8(1, 4);
  header.writeUInt32BE(message.counter >>> 0, 5);
  pub.copy(header, 9);
  return Buffer.concat([header, message.ciphertext]);
}

export function decodeSignalWire(buf: Buffer): SignalCiphertext {
  // Header: magic(4) + version(1) + counter(4) + ratchetPub(32) = 41 bytes
  if (buf.length < 41) {
    throw new Error("signal wire too short");
  }
  if (!buf.subarray(0, 4).equals(SIGNAL_WIRE_MAGIC)) {
    throw new Error("invalid signal wire magic");
  }
  const counter = buf.readUInt32BE(5);
  const ratchetPub = Buffer.from(buf.subarray(9, 41));
  const ciphertext = Buffer.from(buf.subarray(41));
  return { counter, ratchetPub, ciphertext };
}

/**
 * Build a message node body that carries Signal-encrypted protobuf payload.
 * Outer WABinary still wraps this as <message> content.
 */
export function wrapEncryptedBody(opts: {
  signalWire: Buffer;
  /** 0 = regular message ciphertext */
  type?: number;
}): Buffer {
  // Lightweight container: type u8 + signal wire
  return Buffer.concat([Buffer.from([opts.type ?? 0]), opts.signalWire]);
}

export function unwrapEncryptedBody(buf: Buffer): { type: number; signalWire: Buffer } {
  if (buf.length < 2) throw new Error("encrypted body too short");
  return { type: buf[0], signalWire: Buffer.from(buf.subarray(1)) };
}
