/**
 * Message ID deduplication window.
 */
export declare class MessageDeduper {
    private readonly seen;
    private readonly ttlMs;
    private readonly maxSize;
    constructor(ttlMs?: number, maxSize?: number);
    private key;
    /** Returns true if this is the first time seeing the message. */
    checkAndAdd(remoteJid: string, id: string, fromMe?: boolean): boolean;
    has(remoteJid: string, id: string, fromMe?: boolean): boolean;
    private gc;
    clear(): void;
    get size(): number;
}
//# sourceMappingURL=dedup.d.ts.map