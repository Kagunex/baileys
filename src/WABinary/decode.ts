import { TAGS, SINGLE_BYTE_TOKENS } from "./constants.js";
import type { BinaryNode, BinaryNodeAttrs } from "./types.js";

class BinaryReader {
  private i = 0;
  constructor(private readonly data: Buffer) {}

  get remaining(): number {
    return this.data.length - this.i;
  }

  readByte(): number {
    if (this.i >= this.data.length) throw new Error("Unexpected end of binary data");
    return this.data[this.i++];
  }

  readInt16(): number {
    return (this.readByte() << 8) | this.readByte();
  }

  readInt20(): number {
    return (this.readByte() << 16) | (this.readByte() << 8) | this.readByte();
  }

  readInt32(): number {
    return (
      (this.readByte() << 24) |
      (this.readByte() << 16) |
      (this.readByte() << 8) |
      this.readByte()
    );
  }

  readBytes(n: number): Buffer {
    if (this.i + n > this.data.length) throw new Error("Unexpected end of binary data");
    const slice = this.data.subarray(this.i, this.i + n);
    this.i += n;
    return Buffer.from(slice);
  }
}

function readListSize(reader: BinaryReader, tag: number): number {
  if (tag === TAGS.LIST_EMPTY) return 0;
  if (tag === TAGS.LIST_8) return reader.readByte();
  if (tag === TAGS.LIST_16) return reader.readInt16();
  throw new Error(`Invalid list size tag: ${tag}`);
}

function readStringFromToken(reader: BinaryReader, tag: number): string {
  if (tag >= 1 && tag < SINGLE_BYTE_TOKENS.length) {
    return SINGLE_BYTE_TOKENS[tag] ?? "";
  }
  if (tag === TAGS.BINARY_8) {
    const len = reader.readByte();
    return reader.readBytes(len).toString("utf-8");
  }
  if (tag === TAGS.BINARY_20) {
    const len = reader.readInt20();
    return reader.readBytes(len).toString("utf-8");
  }
  if (tag === TAGS.BINARY_32) {
    const len = reader.readInt32();
    return reader.readBytes(len).toString("utf-8");
  }
  if (tag === TAGS.HEX_8) {
    const n = reader.readByte();
    const bytes = reader.readBytes(Math.ceil(n / 2));
    return bytes.toString("hex").slice(0, n);
  }
  if (tag === TAGS.NIBBLE_8) {
    const n = reader.readByte();
    const bytes = reader.readBytes(Math.ceil(n / 2));
    let out = "";
    for (let i = 0; i < bytes.length && out.length < n; i++) {
      const b = bytes[i];
      const hi = (b >> 4) & 0x0f;
      const lo = b & 0x0f;
      const chars = "0123456789\n\r\t";
      if (hi < 12 && out.length < n) out += chars[hi] ?? "";
      if (lo < 12 && out.length < n) out += chars[lo] ?? "";
    }
    return out;
  }
  if (tag === TAGS.JID_PAIR) {
    const userTag = reader.readByte();
    let user = "";
    if (userTag !== TAGS.LIST_EMPTY) {
      user = readStringFromToken(reader, userTag);
    }
    const server = readStringFromToken(reader, reader.readByte());
    return `${user}@${server}`;
  }
  throw new Error(`Unsupported string tag: ${tag}`);
}

function readNode(reader: BinaryReader): BinaryNode {
  const sizeTag = reader.readByte();
  const listSize = readListSize(reader, sizeTag);
  if (listSize === 0) {
    return { tag: "", attrs: {} };
  }
  const tag = readStringFromToken(reader, reader.readByte());
  const attrs: BinaryNodeAttrs = {};
  const attrCount = (listSize - 1) >> 1;
  for (let i = 0; i < attrCount; i++) {
    const key = readStringFromToken(reader, reader.readByte());
    const value = readStringFromToken(reader, reader.readByte());
    attrs[key] = value;
  }
  let content: BinaryNode["content"];
  if (listSize % 2 === 0) {
    // has content
    const contentTag = reader.readByte();
    if (contentTag === TAGS.LIST_EMPTY || contentTag === TAGS.LIST_8 || contentTag === TAGS.LIST_16) {
      const childCount = readListSize(reader, contentTag);
      const children: BinaryNode[] = [];
      for (let i = 0; i < childCount; i++) {
        children.push(readNode(reader));
      }
      content = children;
    } else if (
      contentTag === TAGS.BINARY_8 ||
      contentTag === TAGS.BINARY_20 ||
      contentTag === TAGS.BINARY_32
    ) {
      let len = 0;
      if (contentTag === TAGS.BINARY_8) len = reader.readByte();
      else if (contentTag === TAGS.BINARY_20) len = reader.readInt20();
      else len = reader.readInt32();
      content = reader.readBytes(len);
    } else {
      content = readStringFromToken(reader, contentTag);
    }
  }
  return { tag, attrs, content };
}

/**
 * Decode a binary payload into a BinaryNode tree.
 * Expects the inner WA binary body (not Noise frame headers).
 */
export function decodeBinaryNode(data: Buffer | Uint8Array): BinaryNode {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
  const reader = new BinaryReader(buf);
  return readNode(reader);
}
