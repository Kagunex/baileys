export type { BinaryNode, BinaryNodeAttrs, BinaryNodeData, BinaryNodeCodingOptions } from "./types.js";
export { TAGS, SINGLE_BYTE_TOKENS } from "./constants.js";
export { encodeBinaryNode } from "./encode.js";
export { decodeBinaryNode } from "./decode.js";
export { encodeFrame, decodeFrame } from "./frame.js";

import type { BinaryNode } from "./types.js";

export function getBinaryNodeAttr(node: BinaryNode, key: string): string | undefined {
  return node.attrs?.[key];
}

export function getBinaryNodeChild(node: BinaryNode, tag: string): BinaryNode | undefined {
  const content = node.content;
  if (!Array.isArray(content)) return undefined;
  return content.find((c) => typeof c === "object" && c && "tag" in c && c.tag === tag) as
    | BinaryNode
    | undefined;
}

export function getBinaryNodeChildren(node: BinaryNode, tag?: string): BinaryNode[] {
  const content = node.content;
  if (!Array.isArray(content)) return [];
  const nodes = content.filter((c) => typeof c === "object" && c && "tag" in c) as BinaryNode[];
  if (!tag) return nodes;
  return nodes.filter((n) => n.tag === tag);
}
