import type { BaileysEventMap } from "../Types/Events.js";
type EventKey = keyof BaileysEventMap;
export declare class EventEmitter {
    private readonly emitter;
    on<T extends EventKey>(event: T, listener: (arg: BaileysEventMap[T]) => void): this;
    once<T extends EventKey>(event: T, listener: (arg: BaileysEventMap[T]) => void): this;
    off<T extends EventKey>(event: T, listener: (arg: BaileysEventMap[T]) => void): this;
    emit<T extends EventKey>(event: T, arg: BaileysEventMap[T]): boolean;
    removeAllListeners<T extends EventKey>(event?: T): this;
    listenerCount<T extends EventKey>(event: T): number;
}
export {};
//# sourceMappingURL=emitter.d.ts.map