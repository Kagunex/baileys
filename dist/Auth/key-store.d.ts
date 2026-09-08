/**
 * Transaction-safe multi-file Signal key store.
 * - atomic write (tmp + rename)
 * - per-process mutex queue for set()
 * - journal file for crash recovery of in-flight batches
 */
import type { SignalKeyStore } from "../Types/Auth.js";
export declare function makeCacheableSignalKeyStore(folder: string): SignalKeyStore;
//# sourceMappingURL=key-store.d.ts.map