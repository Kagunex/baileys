# Signal + Session Store (v1.8.0)

## Features

| Feature | Module | Notes |
|---------|--------|-------|
| Session persistence | `session-store.ts` | load/save/delete via key store |
| Pre-key management | `prekeys.ts` | batch generate, take (consume) |
| Signed pre-key rotation | `prekeys.ts` | age > 7d, local HMAC verify |
| Device identity | `identity.ts` | local + remote identities |
| Session migration | `migration.ts` | `store-meta.json` version |
| Transaction-safe storage | `key-store.ts` | mutex + journal + atomic write |
| Corrupt recovery | `recovery.ts` | validate, delete bad session |

## Usage

```ts
const { state, saveCreds } = await useMultiFileAuthState("./auth");
// auto: migrate store, ensure pre-key pool, rotate signed pre-key if stale

import { saveSession, loadSessionHealthy } from "@kagunex/baileys";

await saveSession(state.keys, sessionState, 0);
const health = await loadSessionHealthy(state.keys, "628xxx", 0);
if (!health.ok && health.recovered) {
  // re-establish session
}
```

## Honest limits

- Signed pre-key signature is **local HMAC**, not WA Curve server signature.
- Full multi-device Signal interop still Partial.
