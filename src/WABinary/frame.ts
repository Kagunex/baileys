/**
 * Length-prefixed binary frame helpers (outer envelope).
 * Noise encryption of the payload is a separate layer (not implemented here).
 */

export function encodeFrame(payload: Buffer): Buffer {
  const len = payload.length;
  if (len >= 0x1000000) {
    throw new Error("Frame too large");
  }
  const header = Buffer.alloc(3);
  header[0] = (len >> 16) & 0xff;
  header[1] = (len >> 8) & 0xff;
  header[2] = len & 0xff;
  return Buffer.concat([header, payload]);
}

export function decodeFrame(data: Buffer): { payload: Buffer; rest: Buffer } | undefined {
  if (data.length < 3) return undefined;
  const len = (data[0] << 16) | (data[1] << 8) | data[2];
  if (data.length < 3 + len) return undefined;
  return {
    payload: data.subarray(3, 3 + len),
    rest: data.subarray(3 + len),
  };
}
