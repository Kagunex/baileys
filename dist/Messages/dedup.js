/**
 * Message ID deduplication window.
 */
export class MessageDeduper {
    seen = new Map();
    ttlMs;
    maxSize;
    constructor(ttlMs = 5 * 60_000, maxSize = 5000) {
        this.ttlMs = ttlMs;
        this.maxSize = maxSize;
    }
    key(remoteJid, id, fromMe) {
        return `${fromMe ? "1" : "0"}:${remoteJid}:${id}`;
    }
    /** Returns true if this is the first time seeing the message. */
    checkAndAdd(remoteJid, id, fromMe) {
        this.gc();
        const k = this.key(remoteJid, id, fromMe);
        if (this.seen.has(k))
            return false;
        this.seen.set(k, Date.now());
        if (this.seen.size > this.maxSize) {
            // drop oldest
            const first = this.seen.keys().next().value;
            if (first)
                this.seen.delete(first);
        }
        return true;
    }
    has(remoteJid, id, fromMe) {
        return this.seen.has(this.key(remoteJid, id, fromMe));
    }
    gc() {
        const now = Date.now();
        for (const [k, t] of this.seen) {
            if (now - t > this.ttlMs)
                this.seen.delete(k);
        }
    }
    clear() {
        this.seen.clear();
    }
    get size() {
        return this.seen.size;
    }
}
//# sourceMappingURL=dedup.js.map