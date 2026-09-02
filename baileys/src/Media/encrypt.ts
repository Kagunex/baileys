
import { randomBytes, createCipheriv, createDecipheriv, createHash } from "node:crypto";
import { toBuffer } from "../Utils/buffers.js";
import { hkdf } from "../Utils/crypto.js";
import { MediaError } from "../Errors/errors.js";
export type EncryptedMedia = { ciphertext: Buffer; mediaKey: Buffer; fileSha256: Buffer; fileEncSha256: Buffer; mac: Buffer };
export function encryptMedia(plaintext: Buffer | Uint8Array): EncryptedMedia {
  const data = toBuffer(plaintext); const mediaKey = randomBytes(32);
  const fileSha256 = createHash("sha256").update(data).digest();
  const expanded = hkdf(mediaKey, 112, "WhatsApp Media Keys");
  const iv = expanded.subarray(0, 16); const cipherKey = expanded.subarray(16, 48); const macKey = expanded.subarray(48, 80);
  const cipher = createCipheriv("aes-256-cbc", cipherKey, iv);
  const ciphertext = Buffer.concat([cipher.update(data), cipher.final()]);
  const mac = createHash("sha256").update(macKey).update(iv).update(ciphertext).digest().subarray(0, 10);
  const encFull = Buffer.concat([ciphertext, mac]);
  return { ciphertext: encFull, mediaKey, fileSha256, fileEncSha256: createHash("sha256").update(encFull).digest(), mac };
}
export function decryptMedia(ciphertextWithMac: Buffer | Uint8Array, mediaKey: Buffer | Uint8Array): Buffer {
  const data = toBuffer(ciphertextWithMac);
  if (data.length < 10) throw new MediaError("Ciphertext too short");
  const expanded = hkdf(toBuffer(mediaKey), 112, "WhatsApp Media Keys");
  const iv = expanded.subarray(0, 16); const cipherKey = expanded.subarray(16, 48);
  const ciphertext = data.subarray(0, data.length - 10);
  try {
    const decipher = createDecipheriv("aes-256-cbc", cipherKey, iv);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch (err) { throw new MediaError("Media decryption failed", { cause: err }); }
}
