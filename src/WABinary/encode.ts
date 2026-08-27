import { TAGS, SINGLE_BYTE_TOKENS } from "./constants.js";
import type { BinaryNode, BinaryNodeAttrs, BinaryNodeCodingOptions } from "./types.js";

const tokenIndex = new Map<string, number>();
for (let i = 0; i < SINGLE_BYTE_TOKENS.length; i++) {
  const t = SINGLE_BYTE_TOKENS[i];
  if (t && !tokenIndex.has(t)) tokenIndex.set(t, i);
}

function writeByte(out: number[], value: number): void {
  out.push(value & 0xff);
}

function writeInt16(out: number[], value: number): void {
  out.push((value >> 8) & 0xff, value & 0xff);
}

function writeInt20(out: number[], value: number): void {
  out.push((value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff);
}

function writeInt32(out: number[], value: number): void {
  out.push((value >> 24) & 0xff, (value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff);
}

function writeStringRaw(out: number[], str: string): void {
  const buf = Buffer.from(str, "utf-8");
  if (buf.length < 256) {
    writeByte(out, TAGS.BINARY_8);
    writeByte(out, buf.length);
  } else if (buf.length < 1_048_576) {
    writeByte(out, TAGS.BINARY_20);
    writeInt20(out, buf.length);
  } else {
    writeByte(out, TAGS.BINARY_32);
    writeInt32(out, buf.length);
  }
  for (const b of buf) out.push(b);
}

function writeString(out: number[], str: string, strict?: boolean): void {
  const idx = tokenIndex.get(str);
  if (idx !== undefined && idx < 256) {
    writeByte(out, idx);
    return;
  }
  if (strict) {
    throw new Error(`Unknown binary token (strict): ${str}`);
  }
  writeStringRaw(out, str);
}

function writeJid(out: number[], user: string, server: string): void {
  writeByte(out, TAGS.JID_PAIR);
  if (user.length === 0) {
    writeByte(out, TAGS.LIST_EMPTY);
  } else {
    writeString(out, user);
  }
  writeString(out, server);
}

function writeAttributes(out: number[], attrs: BinaryNodeAttrs, strict?: boolean): void {
  for (const [key, value] of Object.entries(attrs)) {
    writeString(out, key, strict);
    if (key === "jid" || key === "to" || key === "from" || key === "participant") {
      const at = value.indexOf("@");
      if (at > 0) {
        writeJid(out, value.slice(0, at), value.slice(at + 1));
        continue;
      }
    }
    writeString(out, value, strict);
  }
}

function writeListSize(out: number[], size: number): void {
  if (size === 0) {
    writeByte(out, TAGS.LIST_EMPTY);
  } else if (size < 256) {
    writeByte(out, TAGS.LIST_8);
    writeByte(out, size);
  } else {
    writeByte(out, TAGS.LIST_16);
    writeInt16(out, size);
  }
}

function writeNode(out: number[], node: BinaryNode, options?: BinaryNodeCodingOptions): void {
  const attrs = node.attrs ?? {};
  const attrKeys = Object.keys(attrs);
  let listSize = 1 + attrKeys.length * 2;
  const content = node.content;
  const hasContent =
    content !== undefined &&
    content !== null &&
    !(Array.isArray(content) && content.length === 0) &&
    !(typeof content === "string" && content.length === 0);

  if (hasContent) listSize += 1;
  writeListSize(out, listSize);
  writeString(out, node.tag, options?.strict);
  writeAttributes(out, attrs, options?.strict);

  if (!hasContent) return;

  if (typeof content === "string") {
    writeString(out, content, options?.strict);
  } else if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
    const buf = Buffer.isBuffer(content) ? content : Buffer.from(content);
    if (buf.length < 256) {
      writeByte(out, TAGS.BINARY_8);
      writeByte(out, buf.length);
    } else if (buf.length < 1_048_576) {
      writeByte(out, TAGS.BINARY_20);
      writeInt20(out, buf.length);
    } else {
      writeByte(out, TAGS.BINARY_32);
      writeInt32(out, buf.length);
    }
    for (const b of buf) out.push(b);
  } else if (Array.isArray(content)) {
    writeListSize(out, content.length);
    for (const child of content) {
      if (typeof child === "object" && child && "tag" in child) {
        writeNode(out, child as BinaryNode, options);
      }
    }
  } else if (typeof content === "object" && content && "tag" in content) {
    writeListSize(out, 1);
    writeNode(out, content as BinaryNode, options);
  }
}

/**
 * Encode a BinaryNode tree into the WhatsApp-style binary frame payload
 * (without the outer Noise / length framing).
 */
export function encodeBinaryNode(node: BinaryNode, options?: BinaryNodeCodingOptions): Buffer {
  const out: number[] = [];
  writeNode(out, node, options);
  return Buffer.from(out);
}
