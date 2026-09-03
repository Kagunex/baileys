/**
 * Minimal protobuf wire helpers for Noise certificate parsing
 * and interim message envelopes.
 */
function readVarint(buf, offset) {
    let result = 0;
    let shift = 0;
    let pos = offset;
    while (pos < buf.length) {
        const byte = buf[pos++];
        result |= (byte & 0x7f) << shift;
        if ((byte & 0x80) === 0)
            break;
        shift += 7;
        if (shift > 35)
            throw new Error("protobuf: varint too long");
    }
    return { value: result >>> 0, next: pos };
}
function readVarintBig(buf, offset) {
    let result = 0n;
    let shift = 0n;
    let pos = offset;
    while (pos < buf.length) {
        const byte = BigInt(buf[pos++]);
        result |= (byte & 0x7fn) << shift;
        if ((byte & 0x80n) === 0n)
            break;
        shift += 7n;
    }
    return { value: result, next: pos };
}
/** Parse top-level protobuf fields from a buffer. */
export function readFields(buf) {
    const data = Buffer.from(buf);
    const fields = [];
    let offset = 0;
    while (offset < data.length) {
        const tagInfo = readVarint(data, offset);
        offset = tagInfo.next;
        const fieldNumber = tagInfo.value >>> 3;
        const wireType = tagInfo.value & 0x07;
        if (wireType === 0) {
            // varint
            const v = readVarintBig(data, offset);
            offset = v.next;
            fields.push({ number: fieldNumber, wireType, value: v.value });
        }
        else if (wireType === 1) {
            // 64-bit
            const raw = data.subarray(offset, offset + 8);
            offset += 8;
            fields.push({ number: fieldNumber, wireType, value: raw, raw });
        }
        else if (wireType === 2) {
            // length-delimited
            const lenInfo = readVarint(data, offset);
            offset = lenInfo.next;
            const raw = data.subarray(offset, offset + lenInfo.value);
            offset += lenInfo.value;
            fields.push({ number: fieldNumber, wireType, value: raw, raw });
        }
        else if (wireType === 5) {
            // 32-bit
            const raw = data.subarray(offset, offset + 4);
            offset += 4;
            fields.push({ number: fieldNumber, wireType, value: raw, raw });
        }
        else {
            throw new Error(`protobuf: unsupported wire type ${wireType}`);
        }
    }
    return fields;
}
export function fieldBytes(fields, number) {
    const f = fields.find((x) => x.number === number && x.wireType === 2);
    if (!f)
        return undefined;
    if (Buffer.isBuffer(f.value))
        return f.value;
    if (typeof f.value === "object" && f.value && f.value instanceof Uint8Array)
        return Buffer.from(f.value);
    return undefined;
}
export function fieldString(fields, number) {
    const b = fieldBytes(fields, number);
    return b ? b.toString("utf8") : undefined;
}
export function fieldInt(fields, number) {
    const f = fields.find((x) => x.number === number && x.wireType === 0);
    if (!f)
        return undefined;
    if (typeof f.value === "bigint")
        return Number(f.value);
    if (typeof f.value === "number")
        return f.value;
    return undefined;
}
function writeVarint(value) {
    const out = [];
    let v = value >>> 0;
    while (v >= 0x80) {
        out.push((v & 0x7f) | 0x80);
        v >>>= 7;
    }
    out.push(v);
    return Buffer.from(out);
}
/** Encode a length-delimited bytes field. */
export function encodeBytes(fieldNumber, data) {
    const tag = writeVarint((fieldNumber << 3) | 2);
    const body = Buffer.from(data);
    const len = writeVarint(body.length);
    return Buffer.concat([tag, len, body]);
}
/** Encode a varint field. */
export function encodeVarint(fieldNumber, value) {
    const tag = writeVarint((fieldNumber << 3) | 0);
    return Buffer.concat([tag, writeVarint(value)]);
}
/** Encode a string field. */
export function encodeString(fieldNumber, value) {
    return encodeBytes(fieldNumber, Buffer.from(value, "utf8"));
}
//# sourceMappingURL=protobuf.js.map