/**
 * Signal-style session (KaguneX).
 * X3DH-ish shared secret + symmetric ratchet with DH ratchet steps.
 * WhatsApp mobile protobuf wire format is NOT claimed.
 */
import type { KeyPair } from "../Types/Auth.js";
export type SignalAddress = {
    name: string;
    deviceId: number;
};
export type RatchetChain = {
    chainKey: Buffer;
    counter: number;
};
export type SignalSessionState = {
    remoteAddress: string;
    rootKey: Buffer;
    sending: RatchetChain;
    receiving: RatchetChain;
    remoteRatchetPub?: Buffer;
    localRatchet: KeyPair;
    /** previous local ratchet pub sent in header */
    localRatchetPub?: Buffer;
    skipped: Record<string, Buffer>;
};
export type SignalCiphertext = {
    counter: number;
    ratchetPub: Buffer;
    ciphertext: Buffer;
};
export type PreKeyBundle = {
    identityKey: Buffer;
    signedPreKey: {
        keyId: number;
        publicKey: Buffer;
        signature?: Buffer;
    };
    oneTimePreKey?: {
        keyId: number;
        publicKey: Buffer;
    };
    registrationId?: number;
};
/**
 * Alice initiates with Bob's pre-key bundle.
 * Also returns Bob-side initial session so both parties can talk in tests.
 */
export declare function establishSessions(params: {
    remoteAddress: string;
    aliceIdentity: KeyPair;
    bobIdentity: KeyPair;
    bobSignedPreKey: KeyPair;
    bobOneTimePreKey?: KeyPair;
}): {
    alice: SignalSessionState;
    bob: SignalSessionState;
    aliceEphemeral: Buffer;
};
export declare function initSessionAsInitiator(params: {
    remoteAddress: string;
    localIdentity: KeyPair;
    remoteIdentityPub: Buffer;
    remoteSignedPreKeyPub: Buffer;
    remoteOneTimePreKeyPub?: Buffer;
}): SignalSessionState;
export declare function initSessionAsResponder(params: {
    remoteAddress: string;
    localIdentity: KeyPair;
    localSignedPreKey: KeyPair;
    remoteIdentityPub: Buffer;
    remoteEphemeralPub: Buffer;
    localOneTimePreKey?: KeyPair;
}): SignalSessionState;
export declare function signalEncrypt(session: SignalSessionState, plaintext: Buffer | Uint8Array): {
    session: SignalSessionState;
    message: SignalCiphertext;
};
export declare function signalDecrypt(session: SignalSessionState, message: SignalCiphertext): {
    session: SignalSessionState;
    plaintext: Buffer;
};
export declare function serializeSession(session: SignalSessionState): Uint8Array;
export declare function deserializeSession(data: Uint8Array): SignalSessionState;
/** In-memory session manager keyed by address string */
export declare class SignalSessionManager {
    private sessions;
    get(address: string): SignalSessionState | undefined;
    set(address: string, session: SignalSessionState): void;
    delete(address: string): void;
    encrypt(address: string, plaintext: Buffer | Uint8Array): SignalCiphertext;
    decrypt(address: string, message: SignalCiphertext): Buffer;
}
export declare function encryptSignalMessage(_address: string, _plaintext: Uint8Array): Promise<Uint8Array>;
export declare function decryptSignalMessage(_address: string, _ciphertext: Uint8Array): Promise<Uint8Array>;
//# sourceMappingURL=session.d.ts.map