/**
 * Generic IQ request/response waiter over Noise session.
 */
import type { Logger } from "pino";
import type { BinaryNode } from "../WABinary/types.js";
import type { NoiseSession } from "../Noise/session.js";
export type IqNet = {
    session: NoiseSession;
    send: (plaintext: Buffer) => void;
};
export type IqController = {
    onPayload: (payload: Buffer) => void;
    query: (encodedIq: Buffer, iqId: string, net: IqNet, timeoutMs?: number) => Promise<BinaryNode>;
    cancelAll: (reason?: string) => void;
};
export declare function createIqController(logger?: Logger): IqController;
//# sourceMappingURL=iq-controller.d.ts.map