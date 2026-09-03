import type { AuthenticationCreds } from "../Types/Auth.js";
export declare function initAuthCreds(): AuthenticationCreds;
export declare function serializeCreds(creds: AuthenticationCreds): Record<string, unknown>;
export declare function deserializeCreds(data: Record<string, unknown>): AuthenticationCreds;
//# sourceMappingURL=credentials.d.ts.map