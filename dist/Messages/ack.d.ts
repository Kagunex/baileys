/**
 * Server ACK / receipt parsing and pending ACK waiters.
 */
export type ReceiptType = "delivery" | "read" | "played" | "server" | "unknown";
export type MessageReceipt = {
    id: string;
    remoteJid?: string;
    participant?: string;
    type: ReceiptType;
    timestamp?: number;
};
export declare function parseReceiptNode(payload: Buffer): MessageReceipt[];
export declare function isAckOrReceiptPayload(payload: Buffer): boolean;
/** Build receipt stanza we send to server (client ACK for incoming). */
export declare function buildReceiptNode(opts: {
    to: string;
    ids: string[];
    type?: string;
    participant?: string;
}): {
    encoded: Buffer;
};
/** Pending server-ACK waiters keyed by message id */
export declare class AckWaiter {
    private waiters;
    wait(id: string, timeoutMs?: number): Promise<MessageReceipt>;
    handle(receipts: MessageReceipt[]): void;
    cancelAll(reason?: string): void;
}
//# sourceMappingURL=ack.d.ts.map