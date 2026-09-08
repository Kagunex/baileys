import { promises as fs } from "node:fs";
import path from "node:path";
import { initAuthCreds, serializeCreds, deserializeCreds } from "./credentials.js";
import { makeCacheableSignalKeyStore } from "./key-store.js";
import { migrateSignalStore } from "../Signal/migration.js";
import { ensurePreKeyPool, shouldRotateSignedPreKey, rotateSignedPreKey, } from "../Signal/prekeys.js";
async function atomicWrite(filePath, data) {
    const tmp = `${filePath}.${process.pid}.${Date.now()}.tmp`;
    await fs.writeFile(tmp, data, "utf-8");
    await fs.rename(tmp, filePath);
}
export async function useMultiFileAuthState(folder) {
    await fs.mkdir(folder, { recursive: true });
    // Schema migration for key store folder
    await migrateSignalStore(folder);
    const credsPath = path.join(folder, "creds.json");
    let creds = initAuthCreds();
    try {
        creds = deserializeCreds(JSON.parse(await fs.readFile(credsPath, "utf-8")));
    }
    catch (err) {
        if (err.code !== "ENOENT") {
            try {
                await fs.rename(credsPath, `${credsPath}.bak.${Date.now()}`);
            }
            catch {
                /* */
            }
        }
    }
    const keys = makeCacheableSignalKeyStore(folder);
    // Maintain pre-key pool + optional signed pre-key rotation
    try {
        if (shouldRotateSignedPreKey(creds)) {
            const { creds: rotated } = rotateSignedPreKey(creds);
            creds = rotated;
        }
        creds = await ensurePreKeyPool(creds, keys, 10);
    }
    catch {
        /* non-fatal */
    }
    const saveCreds = async () => {
        await atomicWrite(credsPath, JSON.stringify(serializeCreds(creds), null, 2));
    };
    try {
        await fs.access(credsPath);
    }
    catch {
        await saveCreds();
    }
    // Persist if we rotated / generated prekeys
    await saveCreds();
    return { state: { creds, keys }, saveCreds };
}
//# sourceMappingURL=use-multi-file-auth-state.js.map