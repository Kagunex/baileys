/**
 * Device identity helpers.
 */
import type { AuthenticationCreds, KeyPair, ProtocolAddress, SignalIdentity } from "../Types/Auth.js";
export declare function getDeviceIdentity(creds: AuthenticationCreds): {
    registrationId: number;
    identityKey: KeyPair;
    address?: ProtocolAddress;
};
export declare function upsertRemoteIdentity(creds: AuthenticationCreds, identifier: ProtocolAddress, identifierKey: Uint8Array): AuthenticationCreds;
export declare function findRemoteIdentity(creds: AuthenticationCreds, name: string, deviceId?: number): SignalIdentity | undefined;
/** Rotate device identity keypair (destructive — sessions must be rebuilt). */
export declare function rotateDeviceIdentity(creds: AuthenticationCreds): AuthenticationCreds;
//# sourceMappingURL=identity.d.ts.map