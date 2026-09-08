import type { EventEmitter } from "../Events/emitter.js";
import type { ConnectionUpdate, BaileysEventMap } from "../Types/Events.js";
import type { EventBuffer } from "../Events/buffer.js";

export function emitConnectionUpdate(
  ev: EventEmitter,
  update: ConnectionUpdate,
  buffer?: EventBuffer,
): void {
  if (buffer?.push("connection.update", update)) return;
  ev.emit("connection.update", update);
}

export function emitBuffered<E extends keyof BaileysEventMap>(
  ev: EventEmitter,
  event: E,
  data: BaileysEventMap[E],
  buffer?: EventBuffer,
): void {
  if (buffer?.push(event, data)) return;
  ev.emit(event, data);
}
