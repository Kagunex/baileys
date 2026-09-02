/**
 * Binary node helpers.
 */
export { encodeBinaryNode } from "./encode.js";
export { decodeBinaryNode } from "./decode.js";
export { encodeFrame, decodeFrame } from "./frame.js";
export function getBinaryNodeAttr(node, name) {
    if (!node?.attrs)
        return undefined;
    return node.attrs[name];
}
export function getBinaryNodeChild(node, childTag) {
    if (!node || !Array.isArray(node.content))
        return undefined;
    return node.content.find((c) => c && c.tag === childTag);
}
export function getBinaryNodeChildren(node, childTag) {
    if (!node || !Array.isArray(node.content))
        return [];
    if (childTag == null)
        return node.content.filter(Boolean);
    return node.content.filter((c) => c && c.tag === childTag);
}
export function getBinaryNodeChildString(node, childTag) {
    const child = getBinaryNodeChild(node, childTag);
    if (!child)
        return undefined;
    if (typeof child.content === "string")
        return child.content;
    if (Buffer.isBuffer(child.content) || child.content instanceof Uint8Array) {
        return Buffer.from(child.content).toString("utf8");
    }
    return undefined;
}
export function binaryNodeToString(node, indent = 0) {
    const pad = "  ".repeat(indent);
    const attrs = Object.entries(node.attrs || {})
        .map(([k, v]) => `${k}="${v}"`)
        .join(" ");
    const open = attrs ? `<${node.tag} ${attrs}>` : `<${node.tag}>`;
    if (!node.content)
        return `${pad}${open.slice(0, -1)} />`;
    if (typeof node.content === "string") {
        return `${pad}${open}${node.content}</${node.tag}>`;
    }
    if (Buffer.isBuffer(node.content) || node.content instanceof Uint8Array) {
        return `${pad}${open}[${node.content.length} bytes]</${node.tag}>`;
    }
    const children = node.content
        .map((c) => binaryNodeToString(c, indent + 1))
        .join("\n");
    return `${pad}${open}\n${children}\n${pad}</${node.tag}>`;
}
//# sourceMappingURL=index.js.map