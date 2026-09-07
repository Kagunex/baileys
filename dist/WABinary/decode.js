/**
 * Decode WhatsApp-style binary XML into BinaryNode trees.
 * Compatible with the KaguneX encoder and typical WA list/string/binary tokens.
 */
const TAGS = {
    LIST_EMPTY: 0,
    STREAM_END: 2,
    DICTIONARY_0: 236,
    DICTIONARY_1: 237,
    DICTIONARY_2: 238,
    DICTIONARY_3: 239,
    LIST_8: 248,
    LIST_16: 249,
    JID_PAIR: 250,
    HEX_8: 251,
    BINARY_8: 252,
    BINARY_20: 253,
    BINARY_32: 254,
    NIBBLE_8: 255,
};
class BinaryReader {
    buf;
    i = 0;
    constructor(buf) {
        this.buf = buf;
    }
    get remaining() {
        return this.buf.length - this.i;
    }
    readByte() {
        if (this.i >= this.buf.length)
            throw new Error("WABinary: unexpected EOF");
        return this.buf[this.i++];
    }
    readBytes(n) {
        if (this.i + n > this.buf.length)
            throw new Error("WABinary: unexpected EOF");
        const slice = this.buf.subarray(this.i, this.i + n);
        this.i += n;
        return slice;
    }
    readInt16() {
        const b0 = this.readByte();
        const b1 = this.readByte();
        return (b0 << 8) | b1;
    }
    readInt20() {
        const b0 = this.readByte();
        const b1 = this.readByte();
        const b2 = this.readByte();
        return ((b0 & 0x0f) << 16) | (b1 << 8) | b2;
    }
    readInt32() {
        const b0 = this.readByte();
        const b1 = this.readByte();
        const b2 = this.readByte();
        const b3 = this.readByte();
        return (b0 * 0x1000000) + (b1 << 16) + (b2 << 8) + b3;
    }
}
function readListSize(tag, reader) {
    if (tag === TAGS.LIST_EMPTY)
        return 0;
    if (tag === TAGS.LIST_8)
        return reader.readByte();
    if (tag === TAGS.LIST_16)
        return reader.readInt16();
    throw new Error(`WABinary: invalid list tag ${tag}`);
}
function readStringFromToken(tag, reader) {
    if (tag === TAGS.LIST_EMPTY)
        return "";
    if (tag === TAGS.BINARY_8) {
        const len = reader.readByte();
        return reader.readBytes(len).toString("utf8");
    }
    if (tag === TAGS.BINARY_20) {
        const len = reader.readInt20();
        return reader.readBytes(len).toString("utf8");
    }
    if (tag === TAGS.BINARY_32) {
        const len = reader.readInt32();
        return reader.readBytes(len).toString("utf8");
    }
    if (tag === TAGS.JID_PAIR) {
        const user = readString(reader);
        const server = readString(reader);
        return user ? `${user}@${server}` : server;
    }
    if (tag === TAGS.NIBBLE_8 || tag === TAGS.HEX_8) {
        // packed nibble / hex — decode as packed digits
        const size = reader.readByte();
        const numBytes = Math.ceil(size / 2);
        const raw = reader.readBytes(numBytes);
        let out = "";
        const hexChars = "0123456789ABCDEF";
        for (let i = 0; i < raw.length; i++) {
            const b = raw[i];
            const high = (b >> 4) & 0x0f;
            const low = b & 0x0f;
            if (i * 2 < size)
                out += hexChars[high];
            if (i * 2 + 1 < size && low !== 0x0f)
                out += hexChars[low];
        }
        return out;
    }
    // single-byte token dictionary indices fall back to string of the number
    if (tag >= 3 && tag < TAGS.DICTIONARY_0) {
        return String(tag);
    }
    // dictionary double-byte
    if (tag === TAGS.DICTIONARY_0 ||
        tag === TAGS.DICTIONARY_1 ||
        tag === TAGS.DICTIONARY_2 ||
        tag === TAGS.DICTIONARY_3) {
        const index = reader.readByte();
        return `dict:${tag}:${index}`;
    }
    throw new Error(`WABinary: invalid string tag ${tag}`);
}
function readString(reader) {
    const tag = reader.readByte();
    return readStringFromToken(tag, reader);
}
function readBinary(tag, reader) {
    let len;
    if (tag === TAGS.BINARY_8)
        len = reader.readByte();
    else if (tag === TAGS.BINARY_20)
        len = reader.readInt20();
    else if (tag === TAGS.BINARY_32)
        len = reader.readInt32();
    else
        throw new Error(`WABinary: invalid binary tag ${tag}`);
    return reader.readBytes(len);
}
function readNode(reader) {
    const listTag = reader.readByte();
    const listSize = readListSize(listTag, reader);
    if (listSize === 0) {
        return { tag: "", attrs: {} };
    }
    const tag = readString(reader);
    const attrs = {};
    const attrCount = Math.floor((listSize - 1) / 2);
    for (let i = 0; i < attrCount; i++) {
        const key = readString(reader);
        const value = readString(reader);
        attrs[key] = value;
    }
    let content;
    if (listSize % 2 === 0) {
        // has content
        const contentTag = reader.readByte();
        if (contentTag === TAGS.LIST_EMPTY ||
            contentTag === TAGS.LIST_8 ||
            contentTag === TAGS.LIST_16) {
            const childCount = readListSize(contentTag, reader);
            const children = [];
            for (let i = 0; i < childCount; i++) {
                children.push(readNode(reader));
            }
            content = children;
        }
        else if (contentTag === TAGS.BINARY_8 ||
            contentTag === TAGS.BINARY_20 ||
            contentTag === TAGS.BINARY_32) {
            content = readBinary(contentTag, reader);
        }
        else {
            // string-like
            content = readStringFromToken(contentTag, reader);
        }
    }
    return { tag, attrs, content };
}
/** Decode a single BinaryNode from a buffer. */
export function decodeBinaryNode(data) {
    const reader = new BinaryReader(Buffer.from(data));
    return readNode(reader);
}
//# sourceMappingURL=decode.js.map