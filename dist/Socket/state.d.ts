import type { ConnectionState, ConnectionUpdate } from "../Types/Events.js";
import type { AuthenticationState } from "../Types/Auth.js";
export type InternalSocketState = {
    connection: ConnectionState;
    qr?: string;
    isNewLogin?: boolean;
    lastDisconnect?: ConnectionUpdate["lastDisconnect"];
    auth?: AuthenticationState;
    user?: {
        id: string;
        name?: string;
        lid?: string;
    };
};
export declare function createInitialState(auth?: AuthenticationState): InternalSocketState;
//# sourceMappingURL=state.d.ts.map