/**
 * Event buffer — queue events while reconnecting so listeners don't miss updates.
 */
import type { BaileysEventMap } from "../Types/Events.js";
import type { EventEmitter } from "./emitter.js";
export type BufferedEvent = {
    event: keyof BaileysEventMap;
    data: BaileysEventMap[keyof BaileysEventMap];
    at: number;
};
export declare class EventBuffer {
    private enabled;
    private queue;
    private readonly maxSize;
    constructor(maxSize?: number);
    start(): void;
    stop(): void;
    get isBuffering(): boolean;
    get size(): number;
    /**
     * If buffering, enqueue and return true (caller should NOT emit).
     * If not buffering, return false (caller should emit normally).
     */
    push<E extends keyof BaileysEventMap>(event: E, data: BaileysEventMap[E]): boolean;
    /** Flush all buffered events to emitter; clears queue and stops buffering. */
    flush(ev: EventEmitter): number;
    clear(): void;
}
//# sourceMappingURL=buffer.d.ts.map