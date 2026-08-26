/**
 * Message ID deduplication window.
 */

export class MessageDeduper {
  private readonly seen = new Map<string, number>();
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(ttlMs = 5 * 60_000, maxSize = 5000) {
    this.ttlMs = ttlMs;
    this.maxSize = maxSize;
  }

  private key(remoteJid: string, id: string, fromMe?: boolean): string {
    return `${fromMe ? "1" : "0"}:${remoteJid}:${id}`;
  }

  /** Returns true if this is the first time seeing the message. */
  checkAndAdd(remoteJid: string, id: string, fromMe?: boolean): boolean {
    this.gc();
    const k = this.key(remoteJid, id, fromMe);
    if (this.seen.has(k)) return false;
    this.seen.set(k, Date.now());
    if (this.seen.size > this.maxSize) {
      // drop oldest
      const first = this.seen.keys().next().value;
      if (first) this.seen.delete(first);
    }
    return true;
  }

  has(remoteJid: string, id: string, fromMe?: boolean): boolean {
    return this.seen.has(this.key(remoteJid, id, fromMe));
  }

  private gc(): void {
    const now = Date.now();
    for (const [k, t] of this.seen) {
      if (now - t > this.ttlMs) this.seen.delete(k);
    }
  }

  clear(): void {
    this.seen.clear();
  }

  get size(): number {
    return this.seen.size;
  }
}
