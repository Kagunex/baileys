import type { EventEmitter } from "../Events/emitter.js";
import type { ConnectionUpdate, BaileysEventMap } from "../Types/Events.js";
import type { EventBuffer } from "../Events/buffer.js";
export declare function emitConnectionUpdate(ev: EventEmitter, update: ConnectionUpdate, buffer?: EventBuffer): void;
export declare function emitBuffered<E extends keyof BaileysEventMap>(ev: EventEmitter, event: E, data: BaileysEventMap[E], buffer?: EventBuffer): void;
//# sourceMappingURL=events.d.ts.map