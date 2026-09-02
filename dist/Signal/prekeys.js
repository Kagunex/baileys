/**
 * Pre-key management + signed pre-key rotation.
 */
import { createHmac } from "node:crypto";
import { generateIdentityKeyPair, generatePreKey } from "./keys.js";
const DEFAULT_PREKEY_BATCH = 30;
const SIGNED_PREKEY_MAX_AGE_SEC = 7 * 24 * 3600;
/** Generate one-time pre-keys and store. Updates creds counters. */
export async function generateAndStorePreKeys(creds, keys, count = DEFAULT_PREKEY_BATCH) {
    const dataset = { "pre-key": {} };
    const generated = [];
    let nextId = creds.nextPreKeyId;
    for (let i = 0; i < count; i++) {
        const { keyPair, keyId } = generatePreKey(nextId);
        dataset["pre-key"][String(keyId)] = keyPair;
        generated.push(keyId);
        nextId += 1;
    }
    await keys.set(dataset);
    return {
        creds: {
            ...creds,
            nextPreKeyId: nextId,
            firstUnuploadedPreKeyId: creds.firstUnuploadedPreKeyId,
        },
        generated,
    };
}
/**
 * Local integrity tag for signed pre-key (HMAC-SHA512).
 * Not claimed as WA server Curve signature.
 */
export function signPreKey(identity, preKeyPublic) {
    const h = createHmac("sha512", Buffer.from(identity.private));
    h.update(Buffer.from(preKeyPublic));
    return new Uint8Array(h.digest());
}
export function verifySignedPreKeyLocal(identity, signed) {
    const expected = signPreKey(identity, signed.keyPair.public);
    const a = Buffer.from(expected);
    const b = Buffer.from(signed.signature);
    return a.length === b.length && a.equals(b);
}
export function rotateSignedPreKey(creds) {
    const previous = creds.signedPreKey;
    const keyPair = generateIdentityKeyPair();
    const keyId = (previous?.keyId ?? 0) + 1;
    const signedPreKey = {
        keyPair,
        signature: signPreKey(creds.signedIdentityKey, keyPair.public),
        keyId,
        timestamp: Math.floor(Date.now() / 1000),
    };
    return {
        previous,
        creds: { ...creds, signedPreKey },
    };
}
export function shouldRotateSignedPreKey(creds) {
    const ts = creds.signedPreKey.timestamp;
    if (!ts)
        return true;
    return Math.floor(Date.now() / 1000) - ts > SIGNED_PREKEY_MAX_AGE_SEC;
}
export async function ensurePreKeyPool(creds, keys, minCount = 10) {
    const ids = [];
    for (let i = 0; i < minCount; i++) {
        const id = creds.nextPreKeyId - 1 - i;
        if (id >= 1)
            ids.push(String(id));
    }
    const existing = ids.length ? await keys.get("pre-key", ids) : {};
    if (Object.keys(existing).length >= Math.min(minCount, ids.length) && ids.length >= minCount) {
        return creds;
    }
    const { creds: next } = await generateAndStorePreKeys(creds, keys, DEFAULT_PREKEY_BATCH);
    return next;
}
export async function takePreKey(keys, keyId) {
    const map = await keys.get("pre-key", [String(keyId)]);
    const kp = map[String(keyId)];
    if (!kp)
        return undefined;
    await keys.set({ "pre-key": { [String(keyId)]: null } });
    return kp;
}
//# sourceMappingURL=prekeys.js.map