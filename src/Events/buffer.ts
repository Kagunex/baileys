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

export class EventBuffer {
  private enabled = false;
  private queue: BufferedEvent[] = [];
  private readonly maxSize: number;

  constructor(maxSize = 500) {
    this.maxSize = maxSize;
  }

  start(): void {
    this.enabled = true;
  }

  stop(): void {
    this.enabled = false;
  }

  get isBuffering(): boolean {
    return this.enabled;
  }

  get size(): number {
    return this.queue.length;
  }

  /**
   * If buffering, enqueue and return true (caller should NOT emit).
   * If not buffering, return false (caller should emit normally).
   */
  push<E extends keyof BaileysEventMap>(
    event: E,
    data: BaileysEventMap[E],
  ): boolean {
    if (!this.enabled) return false;
    if (this.queue.length >= this.maxSize) {
      this.queue.shift();
    }
    this.queue.push({ event, data, at: Date.now() });
    return true;
  }

  /** Flush all buffered events to emitter; clears queue and stops buffering. */
  flush(ev: EventEmitter): number {
    const items = this.queue.splice(0, this.queue.length);
    this.enabled = false;
    for (const item of items) {
      ev.emit(item.event as keyof BaileysEventMap, item.data as never);
    }
    return items.length;
  }

  clear(): void {
    this.queue.length = 0;
    this.enabled = false;
  }
}
