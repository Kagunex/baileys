/**
 * Encode BinaryNode trees to WhatsApp-style binary XML.
 *
 * KaguneX uses a simplified but interoperable encoder:
 *  - list/string/binary tokens
 *  - full UTF-8 for unknown tags/attrs/JIDs
 *  - JID packing for *@s.whatsapp.net / *@g.us
 *
 * This is sufficient for the stanzas built by Protocol/, Groups/, Messages/.
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
    SINGLE_BYTE_MAX: 256,
    PACKED_MAX: 254,
};
function pushByte(out, value) {
    out.push(value & 0xff);
}
function pushInt20(out, value) {
    pushByte(out, (value >> 16) & 0x0f);
    pushByte(out, (value >> 8) & 0xff);
    pushByte(out, value & 0xff);
}
function pushInt16(out, value) {
    pushByte(out, (value >> 8) & 0xff);
    pushByte(out, value & 0xff);
}
function pushInt32(out, value) {
    pushByte(out, (value >> 24) & 0xff);
    pushByte(out, (value >> 16) & 0xff);
    pushByte(out, (value >> 8) & 0xff);
    pushByte(out, value & 0xff);
}
function writeString(out, str) {
    const bytes = Buffer.from(str, "utf8");
    if (bytes.length < 256) {
        pushByte(out, TAGS.BINARY_8);
        pushByte(out, bytes.length);
    }
    else if (bytes.length < 1_048_576) {
        pushByte(out, TAGS.BINARY_20);
        pushInt20(out, bytes.length);
    }
    else {
        pushByte(out, TAGS.BINARY_32);
        pushInt32(out, bytes.length);
    }
    for (const b of bytes)
        out.push(b);
}
function writeBinary(out, data) {
    const bytes = Buffer.from(data);
    if (bytes.length < 256) {
        pushByte(out, TAGS.BINARY_8);
        pushByte(out, bytes.length);
    }
    else if (bytes.length < 1_048_576) {
        pushByte(out, TAGS.BINARY_20);
        pushInt20(out, bytes.length);
    }
    else {
        pushByte(out, TAGS.BINARY_32);
        pushInt32(out, bytes.length);
    }
    for (const b of bytes)
        out.push(b);
}
function writeJid(out, jid) {
    const at = jid.indexOf("@");
    if (at > 0) {
        const user = jid.slice(0, at);
        const server = jid.slice(at + 1);
        pushByte(out, TAGS.JID_PAIR);
        if (user.length === 0)
            pushByte(out, TAGS.LIST_EMPTY);
        else
            writeString(out, user);
        writeString(out, server);
        return;
    }
    writeString(out, jid);
}
function isJidLike(value) {
    return value.includes("@") && !value.includes(" ");
}
function writeListStart(out, count) {
    if (count === 0) {
        pushByte(out, TAGS.LIST_EMPTY);
    }
    else if (count < 256) {
        pushByte(out, TAGS.LIST_8);
        pushByte(out, count);
    }
    else {
        pushByte(out, TAGS.LIST_16);
        pushInt16(out, count);
    }
}
function writeNode(out, node) {
    const attrs = node.attrs || {};
    const attrKeys = Object.keys(attrs);
    const hasContent = node.content !== undefined && node.content !== null;
    // list size = 1 (tag) + 2*attrs + (content ? 1 : 0)
    const listSize = 1 + attrKeys.length * 2 + (hasContent ? 1 : 0);
    writeListStart(out, listSize);
    writeString(out, node.tag);
    for (const key of attrKeys) {
        writeString(out, key);
        const val = attrs[key] ?? "";
        if (isJidLike(val))
            writeJid(out, val);
        else
            writeString(out, val);
    }
    if (!hasContent)
        return;
    const content = node.content;
    if (typeof content === "string") {
        writeString(out, content);
    }
    else if (Buffer.isBuffer(content) || content instanceof Uint8Array) {
        writeBinary(out, content);
    }
    else if (Array.isArray(content)) {
        writeListStart(out, content.length);
        for (const child of content)
            writeNode(out, child);
    }
    else {
        writeString(out, String(content));
    }
}
/** Encode a BinaryNode tree to a Buffer. */
export function encodeBinaryNode(node) {
    const out = [];
    writeNode(out, node);
    return Buffer.from(out);
}
//# sourceMappingURL=encode.js.map