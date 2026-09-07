
import type { AuthenticationState, AuthenticationCreds } from "../Types/Auth.js";
import type { EventEmitter } from "../Events/emitter.js";
import { applyCredsUpdate } from "../Auth/auth-utils.js";
export function updateCreds(state: AuthenticationState | undefined, update: Partial<AuthenticationCreds>, ev: EventEmitter): void {
  if (!state) return; applyCredsUpdate(state.creds, update); ev.emit("creds.update", update);
}
