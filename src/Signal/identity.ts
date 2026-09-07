/**
 * Device identity helpers.
 */

import type {
  AuthenticationCreds,
  KeyPair,
  ProtocolAddress,
  SignalIdentity,
} from "../Types/Auth.js";
import { generateIdentityKeyPair } from "./keys.js";

export function getDeviceIdentity(creds: AuthenticationCreds): {
  registrationId: number;
  identityKey: KeyPair;
  address?: ProtocolAddress;
} {
  let address: ProtocolAddress | undefined;
  if (creds.me?.id) {
    // jid like 628xxx:device@s.whatsapp.net
    const user = creds.me.id.split("@")[0] || creds.me.id;
    const [name, deviceStr] = user.split(":");
    address = {
      name: name || user,
      deviceId: deviceStr ? Number(deviceStr) || 0 : 0,
    };
  }
  return {
    registrationId: creds.registrationId,
    identityKey: creds.signedIdentityKey,
    address,
  };
}

export function upsertRemoteIdentity(
  creds: AuthenticationCreds,
  identifier: ProtocolAddress,
  identifierKey: Uint8Array,
): AuthenticationCreds {
  const list = [...(creds.signalIdentities || [])];
  const idx = list.findIndex(
    (i) =>
      i.identifier.name === identifier.name &&
      i.identifier.deviceId === identifier.deviceId,
  );
  const entry: SignalIdentity = { identifier, identifierKey };
  if (idx >= 0) list[idx] = entry;
  else list.push(entry);
  return { ...creds, signalIdentities: list };
}

export function findRemoteIdentity(
  creds: AuthenticationCreds,
  name: string,
  deviceId = 0,
): SignalIdentity | undefined {
  return creds.signalIdentities?.find(
    (i) => i.identifier.name === name && i.identifier.deviceId === deviceId,
  );
}

/** Rotate device identity keypair (destructive — sessions must be rebuilt). */
export function rotateDeviceIdentity(
  creds: AuthenticationCreds,
): AuthenticationCreds {
  return {
    ...creds,
    signedIdentityKey: generateIdentityKeyPair(),
    // force signed prekey rotate together
    signedPreKey: {
      keyPair: generateIdentityKeyPair(),
      signature: new Uint8Array(64),
      keyId: (creds.signedPreKey.keyId || 0) + 1,
      timestamp: Math.floor(Date.now() / 1000),
    },
  };
}
