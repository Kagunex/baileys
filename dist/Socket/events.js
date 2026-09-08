export function emitConnectionUpdate(ev, update, buffer) {
    if (buffer?.push("connection.update", update))
        return;
    ev.emit("connection.update", update);
}
export function emitBuffered(ev, event, data, buffer) {
    if (buffer?.push(event, data))
        return;
    ev.emit(event, data);
}
//# sourceMappingURL=events.js.map