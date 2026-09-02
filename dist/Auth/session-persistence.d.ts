/**
 * Session / connection persistence helpers (alongside multi-file auth).
 */
export type PersistedSessionMeta = {
    lastConnectedAt?: number;
    lastDisconnectReason?: string;
    platform?: string;
    /** opaque routing info base64 */
    routingInfo?: string;
};
export declare function loadSessionMeta(folder: string): Promise<PersistedSessionMeta>;
export declare function saveSessionMeta(folder: string, meta: PersistedSessionMeta): Promise<void>;
//# sourceMappingURL=session-persistence.d.ts.map