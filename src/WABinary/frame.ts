/**
 * Length-prefixed frame codec used by Noise transport.
 * Frame = 3-byte big-endian length || payload
 */

export type DecodedFrame = {
  payload: Buffer;
  rest: Buffer;
};

/** Encode payload as 3-byte BE length + body. */
export function encodeFrame(payload: Buffer | Uint8Array): Buffer {
  const body = Buffer.from(payload);
  if (body.length > 0xffffff) {
    throw new Error(`encodeFrame: payload too large (${body.length})`);
  }
  const header = Buffer.alloc(3);
  header[0] = (body.length >> 16) & 0xff;
  header[1] = (body.length >> 8) & 0xff;
  header[2] = body.length & 0xff;
  return Buffer.concat([header, body]);
}

/**
 * Try to pull one frame from a buffer.
 * Returns null when not enough bytes are available yet.
 */
export function decodeFrame(buffer: Buffer | Uint8Array): DecodedFrame | null {
  const buf = Buffer.from(buffer);
  if (buf.length < 3) return null;
  const len = (buf[0]! << 16) | (buf[1]! << 8) | buf[2]!;
  if (buf.length < 3 + len) return null;
  return {
    payload: buf.subarray(3, 3 + len),
    rest: buf.subarray(3 + len),
  };
}
