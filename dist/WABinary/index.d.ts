/**
 * Binary node helpers.
 */
import type { BinaryNode } from "./types.js";
export type { BinaryNode } from "./types.js";
export { encodeBinaryNode } from "./encode.js";
export { decodeBinaryNode } from "./decode.js";
export { encodeFrame, decodeFrame } from "./frame.js";
export declare function getBinaryNodeAttr(node: BinaryNode | undefined | null, name: string): string | undefined;
export declare function getBinaryNodeChild(node: BinaryNode | undefined | null, childTag: string): BinaryNode | undefined;
export declare function getBinaryNodeChildren(node: BinaryNode | undefined | null, childTag?: string): BinaryNode[];
export declare function getBinaryNodeChildString(node: BinaryNode | undefined | null, childTag: string): string | undefined;
export declare function binaryNodeToString(node: BinaryNode, indent?: number): string;
//# sourceMappingURL=index.d.ts.map