
import type { AuthenticationCreds } from "../Types/Auth.js";
export function applyCredsUpdate(creds: AuthenticationCreds, update: Partial<AuthenticationCreds>): AuthenticationCreds {
  Object.assign(creds, update); return creds;
}
