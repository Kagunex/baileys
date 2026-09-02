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
export declare const SIGNAL_WIRE_MAGIC: any;
export declare function encodeSignalWire(message: SignalCiphertext): Buffer;
export declare function decodeSignalWire(buf: Buffer): SignalCiphertext;
/**
 * Build a message node body that carries Signal-encrypted protobuf payload.
 * Outer WABinary still wraps this as <message> content.
 */
export declare function wrapEncryptedBody(opts: {
    signalWire: Buffer;
    /** 0 = regular message ciphertext */
    type?: number;
}): Buffer;
export declare function unwrapEncryptedBody(buf: Buffer): {
    type: number;
    signalWire: Buffer;
};
//# sourceMappingURL=wire.d.ts.map