/**
 * Event buffer — queue events while reconnecting so listeners don't miss updates.
 */
export class EventBuffer {
    enabled = false;
    queue = [];
    maxSize;
    constructor(maxSize = 500) {
        this.maxSize = maxSize;
    }
    start() {
        this.enabled = true;
    }
    stop() {
        this.enabled = false;
    }
    get isBuffering() {
        return this.enabled;
    }
    get size() {
        return this.queue.length;
    }
    /**
     * If buffering, enqueue and return true (caller should NOT emit).
     * If not buffering, return false (caller should emit normally).
     */
    push(event, data) {
        if (!this.enabled)
            return false;
        if (this.queue.length >= this.maxSize) {
            this.queue.shift();
        }
        this.queue.push({ event, data, at: Date.now() });
        return true;
    }
    /** Flush all buffered events to emitter; clears queue and stops buffering. */
    flush(ev) {
        const items = this.queue.splice(0, this.queue.length);
        this.enabled = false;
        for (const item of items) {
            ev.emit(item.event, item.data);
        }
        return items.length;
    }
    clear() {
        this.queue.length = 0;
        this.enabled = false;
    }
}
//# sourceMappingURL=buffer.js.map