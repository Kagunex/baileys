/**
 * Length-prefixed frame codec used by Noise transport.
 * Frame = 3-byte big-endian length || payload
 */
export type DecodedFrame = {
    payload: Buffer;
    rest: Buffer;
};
/** Encode payload as 3-byte BE length + body. */
export declare function encodeFrame(payload: Buffer | Uint8Array): Buffer;
/**
 * Try to pull one frame from a buffer.
 * Returns null when not enough bytes are available yet.
 */
export declare function decodeFrame(buffer: Buffer | Uint8Array): DecodedFrame | null;
//# sourceMappingURL=frame.d.ts.map