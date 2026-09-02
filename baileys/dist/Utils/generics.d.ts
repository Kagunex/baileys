/**
 * Generic helpers: IDs, registration, jid utils.
 */
/** 14-bit registration ID as used by Signal / WA. */
export declare function generateRegistrationId(): number;
/**
 * Generate a WA-style message ID (uppercase hex, 16–18 chars).
 */
export declare function generateMessageID(prefix?: string): string;
export declare function unixTimestampSeconds(date?: Date): number;
export declare function isJidUser(jid?: string | null): boolean;
export declare function isJidGroup(jid?: string | null): boolean;
export declare function isJidBroadcast(jid?: string | null): boolean;
export declare function jidNormalizedUser(jid?: string | null): string | undefined;
export declare function jidDecode(jid?: string | null): {
    user: string;
    server: string;
    device?: number;
} | undefined;
//# sourceMappingURL=generics.d.ts.map