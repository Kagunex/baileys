/** Minimal BinaryNode model used by the KaguneX binary layer. */

export type BinaryNodeAttrs = { [key: string]: string };

export type BinaryNodeData = BinaryNode | BinaryNode[] | string | Uint8Array | Buffer | undefined;

export type BinaryNode = {
  tag: string;
  attrs: BinaryNodeAttrs;
  content?: BinaryNodeData;
};

export type BinaryNodeCodingOptions = {
  /** When true, unknown tokens throw instead of being written as plain strings */
  strict?: boolean;
};
