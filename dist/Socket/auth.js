import { applyCredsUpdate } from "../Auth/auth-utils.js";
export function updateCreds(state, update, ev) {
    if (!state)
        return;
    applyCredsUpdate(state.creds, update);
    ev.emit("creds.update", update);
}
//# sourceMappingURL=auth.js.map