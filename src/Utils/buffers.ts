export function toBuffer(data: Buffer | Uint8Array | ArrayBuffer | string): Buffer {
  if (Buffer.isBuffer(data)) return data;
  if (typeof data === "string") return Buffer.from(data, "utf-8");
  if (data instanceof ArrayBuffer) return Buffer.from(data);
  return Buffer.from(data);
}

export function encodeBase64(data: Buffer | Uint8Array | string): string {
  return toBuffer(data).toString("base64");
}

export function decodeBase64(data: string): Buffer {
  return Buffer.from(data, "base64");
}

export function encodeBase64Url(data: Buffer | Uint8Array): string {
  return toBuffer(data)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function concatBuffers(...parts: Array<Buffer | Uint8Array>): Buffer {
  return Buffer.concat(parts.map((p) => toBuffer(p)));
}
