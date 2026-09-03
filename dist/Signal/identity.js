/**
 * Device identity helpers.
 */
import { generateIdentityKeyPair } from "./keys.js";
export function getDeviceIdentity(creds) {
    let address;
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
export function upsertRemoteIdentity(creds, identifier, identifierKey) {
    const list = [...(creds.signalIdentities || [])];
    const idx = list.findIndex((i) => i.identifier.name === identifier.name &&
        i.identifier.deviceId === identifier.deviceId);
    const entry = { identifier, identifierKey };
    if (idx >= 0)
        list[idx] = entry;
    else
        list.push(entry);
    return { ...creds, signalIdentities: list };
}
export function findRemoteIdentity(creds, name, deviceId = 0) {
    return creds.signalIdentities?.find((i) => i.identifier.name === name && i.identifier.deviceId === deviceId);
}
/** Rotate device identity keypair (destructive — sessions must be rebuilt). */
export function rotateDeviceIdentity(creds) {
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
//# sourceMappingURL=identity.js.map