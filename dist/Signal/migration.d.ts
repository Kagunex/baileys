/**
 * Session / store schema migration.
 */
export declare const SIGNAL_STORE_VERSION = 2;
export type StoreMeta = {
    version: number;
    migratedAt?: number;
};
export declare function loadStoreMeta(folder: string): Promise<StoreMeta>;
export declare function saveStoreMeta(folder: string, meta: StoreMeta): Promise<void>;
/**
 * Migrate key store folder to current schema version.
 * v0/v1 → v2: ensure store-meta exists; future migrations append here.
 */
export declare function migrateSignalStore(folder: string): Promise<StoreMeta>;
//# sourceMappingURL=migration.d.ts.map