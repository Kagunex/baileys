/**
 * WhatsApp Binary node tree types.
 */
export type BinaryNode = {
    tag: string;
    attrs: {
        [key: string]: string;
    };
    /** string | BinaryNode[] | Buffer | undefined */
    content?: BinaryNode[] | BinaryNode | string | Uint8Array | Buffer | undefined;
};
export type BinaryNodeCodingOptions = {
    /**
     * When true, unknown tags/attrs are written as full UTF-8 strings
     * (JID_PAIR style). Default true for KaguneX.
     */
    allowFullStrings?: boolean;
};
//# sourceMappingURL=types.d.ts.map