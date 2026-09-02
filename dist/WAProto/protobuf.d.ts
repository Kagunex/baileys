/**
 * Minimal protobuf wire helpers for Noise certificate parsing
 * and interim message envelopes.
 */
export type ProtoField = {
    number: number;
    wireType: number;
    value: Buffer | number | string | bigint;
    raw?: Buffer;
};
/** Parse top-level protobuf fields from a buffer. */
export declare function readFields(buf: Buffer | Uint8Array): ProtoField[];
export declare function fieldBytes(fields: ProtoField[], number: number): Buffer | undefined;
export declare function fieldString(fields: ProtoField[], number: number): string | undefined;
export declare function fieldInt(fields: ProtoField[], number: number): number | undefined;
/** Encode a length-delimited bytes field. */
export declare function encodeBytes(fieldNumber: number, data: Buffer | Uint8Array): Buffer;
/** Encode a varint field. */
export declare function encodeVarint(fieldNumber: number, value: number): Buffer;
/** Encode a string field. */
export declare function encodeString(fieldNumber: number, value: string): Buffer;
//# sourceMappingURL=protobuf.d.ts.map