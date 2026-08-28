/**
 * Minimal protobuf binary codec (proto2 subset) for KaguneX WAProto.
 * Supports: varint, len-delimited (string/bytes), fixed64 (as two u32), embedded messages.
 */

export function encodeVarint(value: number): Buffer {
  let n = value >>> 0;
  const out: number[] = [];
  while (n > 0x7f) {
    out.push((n & 0x7f) | 0x80);
    n >>>= 7;
  }
  out.push(n);
  return Buffer.from(out);
}

export function decodeVarint(
  buf: Buffer,
  offset: number,
): { value: number; offset: number } {
  let result = 0;
  let shift = 0;
  let pos = offset;
  while (pos < buf.length) {
    const b = buf[pos++];
    result |= (b & 0x7f) << shift;
    if ((b & 0x80) === 0) break;
    shift += 7;
    if (shift > 35) throw new Error("varint too long");
  }
  return { value: result >>> 0, offset: pos };
}

export function tag(fieldNumber: number, wireType: number): Buffer {
  return encodeVarint((fieldNumber << 3) | wireType);
}

export function encodeString(fieldNumber: number, value: string): Buffer {
  const body = Buffer.from(value, "utf-8");
  return Buffer.concat([tag(fieldNumber, 2), encodeVarint(body.length), body]);
}

export function encodeBytes(fieldNumber: number, value: Buffer): Buffer {
  return Buffer.concat([tag(fieldNumber, 2), encodeVarint(value.length), value]);
}

export function encodeBool(fieldNumber: number, value: boolean): Buffer {
  return Buffer.concat([tag(fieldNumber, 0), encodeVarint(value ? 1 : 0)]);
}

export function encodeInt32(fieldNumber: number, value: number): Buffer {
  return Buffer.concat([tag(fieldNumber, 0), encodeVarint(value)]);
}

export function encodeMessage(fieldNumber: number, body: Buffer): Buffer {
  return Buffer.concat([tag(fieldNumber, 2), encodeVarint(body.length), body]);
}

export type PbField = {
  fieldNumber: number;
  wireType: number;
  value: Buffer | number;
};

export function readFields(buf: Buffer): PbField[] {
  const fields: PbField[] = [];
  let offset = 0;
  while (offset < buf.length) {
    const t = decodeVarint(buf, offset);
    offset = t.offset;
    const fieldNumber = t.value >>> 3;
    const wireType = t.value & 7;
    if (wireType === 0) {
      const v = decodeVarint(buf, offset);
      offset = v.offset;
      fields.push({ fieldNumber, wireType, value: v.value });
    } else if (wireType === 2) {
      const len = decodeVarint(buf, offset);
      offset = len.offset;
      const slice = buf.subarray(offset, offset + len.value);
      offset += len.value;
      fields.push({ fieldNumber, wireType, value: Buffer.from(slice) });
    } else if (wireType === 1) {
      const slice = buf.subarray(offset, offset + 8);
      offset += 8;
      fields.push({ fieldNumber, wireType, value: Buffer.from(slice) });
    } else if (wireType === 5) {
      const slice = buf.subarray(offset, offset + 4);
      offset += 4;
      fields.push({ fieldNumber, wireType, value: Buffer.from(slice) });
    } else {
      throw new Error(`unsupported wire type ${wireType}`);
    }
  }
  return fields;
}

export function fieldString(fields: PbField[], n: number): string | undefined {
  const f = fields.find((x) => x.fieldNumber === n && x.wireType === 2);
  if (!f || !Buffer.isBuffer(f.value)) return undefined;
  return f.value.toString("utf-8");
}

export function fieldBytes(fields: PbField[], n: number): Buffer | undefined {
  const f = fields.find((x) => x.fieldNumber === n && x.wireType === 2);
  if (!f || !Buffer.isBuffer(f.value)) return undefined;
  return f.value;
}

export function fieldBool(fields: PbField[], n: number): boolean | undefined {
  const f = fields.find((x) => x.fieldNumber === n && x.wireType === 0);
  if (!f || typeof f.value !== "number") return undefined;
  return f.value !== 0;
}

export function fieldInt(fields: PbField[], n: number): number | undefined {
  const f = fields.find((x) => x.fieldNumber === n && x.wireType === 0);
  if (!f || typeof f.value !== "number") return undefined;
  return f.value;
}

export function fieldMessage(fields: PbField[], n: number): Buffer | undefined {
  return fieldBytes(fields, n);
}
