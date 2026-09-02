/**
 * Buffer / base64 helpers.
 */

export function toBuffer(data: Buffer | Uint8Array | ArrayBuffer | string): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (typeof data === "string") return Buffer.from(data);
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  return Buffer.from(data.buffer, data.byteOffset, data.byteLength);
}

export function encodeBase64(data: Buffer | Uint8Array | string): string {
  if (typeof data === "string") return Buffer.from(data, "utf8").toString("base64");
  return Buffer.from(data).toString("base64");
}

export function decodeBase64(data: string): Buffer {
  return Buffer.from(data, "base64");
}

export function encodeHex(data: Buffer | Uint8Array): string {
  return Buffer.from(data).toString("hex");
}

export function decodeHex(data: string): Buffer {
  return Buffer.from(data, "hex");
}
