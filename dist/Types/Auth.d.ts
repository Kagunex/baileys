/**
 * Authentication & Signal key store types for KaguneX Baileys.
 * Shapes follow actual usage across Auth/, Signal/, Socket/.
 */
export type KeyPair = {
    public: Uint8Array;
    private: Uint8Array;
};
export type SignedKeyPair = {
    keyPair: KeyPair;
    signature: Uint8Array;
    keyId: number;
    timestamp: number;
};
export type ProtocolAddress = {
    name: string;
    deviceId: number;
};
export type SignalIdentity = {
    identifier: ProtocolAddress;
    identifierKey: Uint8Array;
};
export type Contact = {
    id: string;
    name?: string;
    notify?: string;
    verifiedName?: string;
    imgUrl?: string | null;
    status?: string;
};
/** Full credentials persisted in creds.json */
export type AuthenticationCreds = {
    noiseKey: KeyPair;
    pairingEphemeralKeyPair: KeyPair;
    signedIdentityKey: KeyPair;
    signedPreKey: SignedKeyPair;
    registrationId: number;
    advSecretKey: string;
    processedHistoryMessages: Array<{
        key: {
            remoteJid?: string;
            id?: string;
            fromMe?: boolean;
        };
        messageTimestamp?: number;
    }>;
    nextPreKeyId: number;
    firstUnuploadedPreKeyId: number;
    accountSyncCounter: number;
    accountSettings: {
        unarchiveChats: boolean;
        [key: string]: unknown;
    };
    registered: boolean;
    /** Device identity after pair-success / registered resume */
    me?: Contact;
    /** Active pairing code (while pairing in progress) */
    pairingCode?: string;
    platform?: string;
    routingInfo?: Uint8Array;
    signalIdentities?: SignalIdentity[];
    lastAccountSyncTimestamp?: number;
    myAppStateKeyId?: string;
    [key: string]: unknown;
};
/** Signal key store type map used by key-store get/set */
export type SignalDataTypeMap = {
    "pre-key": KeyPair;
    session: Uint8Array;
    "sender-key": Uint8Array;
    "sender-key-memory": {
        [jid: string]: boolean;
    };
    "app-state-sync-key": unknown;
    "app-state-sync-version": unknown;
    "sender-key-status": unknown;
};
export type SignalDataSet = {
    [T in keyof SignalDataTypeMap]?: {
        [id: string]: SignalDataTypeMap[T] | null;
    };
};
export type SignalKeyStore = {
    get<T extends keyof SignalDataTypeMap>(type: T, ids: string[]): Promise<{
        [id: string]: SignalDataTypeMap[T];
    }>;
    set(data: SignalDataSet): Promise<void>;
    clear?(): Promise<void>;
};
export type AuthenticationState = {
    creds: AuthenticationCreds;
    keys: SignalKeyStore;
};
//# sourceMappingURL=Auth.d.ts.map