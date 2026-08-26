
export type KeyPair = { public: Uint8Array; private: Uint8Array };
export type SignedKeyPair = { keyPair: KeyPair; signature: Uint8Array; keyId: number; timestamp?: number };
export type ProtocolAddress = { name: string; deviceId: number };
export type SignalIdentity = { identifier: ProtocolAddress; identifierKey: Uint8Array };
export type LTHashState = { version: number; hash: Buffer; indexValueMap: { [k: string]: { valueMac: Uint8Array | Buffer } } };
export type SignalCreds = { readonly signedIdentityKey: KeyPair; readonly signedPreKey: SignedKeyPair; registrationId: number };
export type AccountSettings = { unarchiveChats: boolean; defaultDisappearingMode?: Partial<{ ephemeralExpiration: number; ephemeralSettingTimestamp: number }> };
export type AuthenticationCreds = SignalCreds & {
  readonly noiseKey: KeyPair; readonly pairingEphemeralKeyPair: KeyPair; advSecretKey: string;
  me?: { id: string; name?: string; lid?: string };
  account?: { details?: Uint8Array; accountSignatureKey?: Uint8Array; accountSignature?: Uint8Array; deviceSignature?: Uint8Array };
  signalIdentities?: SignalIdentity[]; myAppStateKeyId?: string; firstUnuploadedPreKeyId: number; nextPreKeyId: number;
  lastAccountSyncTimestamp?: number; platform?: string;
  processedHistoryMessages: Array<{ key: { remoteJid: string; id: string; fromMe?: boolean }; messageTimestamp?: number }>;
  accountSyncCounter: number; accountSettings: AccountSettings; registered: boolean; pairingCode?: string;
  lastPropHash?: string; routingInfo?: Buffer;
};
export type SignalDataTypeMap = {
  "pre-key": KeyPair; session: Uint8Array; "sender-key": Uint8Array;
  "app-state-sync-key": { keyData: Uint8Array; fingerprint: { rawId: number; currentIndex: number; deviceIndexes: number[] }; timestamp: number };
  "app-state-sync-version": LTHashState; "sender-key-memory": { [jid: string]: boolean };
};
export type SignalDataSet = { [T in keyof SignalDataTypeMap]?: { [id: string]: SignalDataTypeMap[T] | null } };
export type SignalKeyStore = {
  get: <T extends keyof SignalDataTypeMap>(type: T, ids: string[]) => Promise<{ [id: string]: SignalDataTypeMap[T] }>;
  set: (data: SignalDataSet) => Promise<void>;
  clear?: () => Promise<void>;
};
export type AuthenticationState = { creds: AuthenticationCreds; keys: SignalKeyStore };
