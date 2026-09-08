
import { EventEmitter as NodeEventEmitter } from "node:events";
import type { BaileysEventMap } from "../Types/Events.js";
type EventKey = keyof BaileysEventMap;
export class EventEmitter {
  private readonly emitter = new NodeEventEmitter();
  on<T extends EventKey>(event: T, listener: (arg: BaileysEventMap[T]) => void): this {
    this.emitter.on(event, listener as (...args: unknown[]) => void); return this;
  }
  once<T extends EventKey>(event: T, listener: (arg: BaileysEventMap[T]) => void): this {
    this.emitter.once(event, listener as (...args: unknown[]) => void); return this;
  }
  off<T extends EventKey>(event: T, listener: (arg: BaileysEventMap[T]) => void): this {
    this.emitter.off(event, listener as (...args: unknown[]) => void); return this;
  }
  emit<T extends EventKey>(event: T, arg: BaileysEventMap[T]): boolean { return this.emitter.emit(event, arg); }
  removeAllListeners<T extends EventKey>(event?: T): this {
    if (event) this.emitter.removeAllListeners(event); else this.emitter.removeAllListeners(); return this;
  }
  listenerCount<T extends EventKey>(event: T): number { return this.emitter.listenerCount(event); }
}
