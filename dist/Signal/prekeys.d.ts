/**
 * Pre-key management + signed pre-key rotation.
 */
import type { AuthenticationCreds, KeyPair, SignedKeyPair, SignalKeyStore } from "../Types/Auth.js";
/** Generate one-time pre-keys and store. Updates creds counters. */
export declare function generateAndStorePreKeys(creds: AuthenticationCreds, keys: SignalKeyStore, count?: number): Promise<{
    creds: AuthenticationCreds;
    generated: number[];
}>;
/**
 * Local integrity tag for signed pre-key (HMAC-SHA512).
 * Not claimed as WA server Curve signature.
 */
export declare function signPreKey(identity: KeyPair, preKeyPublic: Uint8Array): Uint8Array;
export declare function verifySignedPreKeyLocal(identity: KeyPair, signed: SignedKeyPair): boolean;
export declare function rotateSignedPreKey(creds: AuthenticationCreds): {
    creds: AuthenticationCreds;
    previous?: SignedKeyPair;
};
export declare function shouldRotateSignedPreKey(creds: AuthenticationCreds): boolean;
export declare function ensurePreKeyPool(creds: AuthenticationCreds, keys: SignalKeyStore, minCount?: number): Promise<AuthenticationCreds>;
export declare function takePreKey(keys: SignalKeyStore, keyId: number): Promise<KeyPair | undefined>;
//# sourceMappingURL=prekeys.d.ts.map