import { EventEmitter as NodeEventEmitter } from "node:events";
export class EventEmitter {
    emitter = new NodeEventEmitter();
    on(event, listener) {
        this.emitter.on(event, listener);
        return this;
    }
    once(event, listener) {
        this.emitter.once(event, listener);
        return this;
    }
    off(event, listener) {
        this.emitter.off(event, listener);
        return this;
    }
    emit(event, arg) { return this.emitter.emit(event, arg); }
    removeAllListeners(event) {
        if (event)
            this.emitter.removeAllListeners(event);
        else
            this.emitter.removeAllListeners();
        return this;
    }
    listenerCount(event) { return this.emitter.listenerCount(event); }
}
//# sourceMappingURL=emitter.js.map