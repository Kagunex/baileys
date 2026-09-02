/**
 * Post-Noise client identification payload.
 * Registered sessions send username + passive=false for resume without pairing.
 */
import type { BinaryNode } from "../WABinary/types.js";
import type { BrowserDescription } from "../Types/Socket.js";
export type ClientPayloadOptions = {
    version?: [number, number, number];
    browser?: BrowserDescription;
    username?: string;
    /** When true, session resume (no QR/pairing). Default: !username */
    passive?: boolean;
    connectType?: "offline" | "wifi_unknown" | "wifi_cellular";
    connectReason?: "user_activated" | "push" | "unknown";
    /** pull / full history flags */
    pull?: boolean;
};
export declare function buildClientPayloadNode(options?: ClientPayloadOptions): BinaryNode;
export declare function encodeClientPayload(options?: ClientPayloadOptions): Buffer;
//# sourceMappingURL=client-payload.d.ts.map