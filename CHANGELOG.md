# Changelog

## [1.6.0] - 2026-08-26

### PRIORITY #1 — Pairing + QR login lifecycle

- `src/Socket/login-lifecycle.ts` — mode detection, loggedOut, pair-success apply
- Client payload: registered resume (`username` + passive=false)
- QR only from real server `ref`
- Pairing timeout/retry (controller) + persist pairingCode
- Detect 401 loggedOut → clear registration, stop registered reconnect
- Example: `Example/login-pairing.ts`
- Tests: `tests/login-lifecycle.test.ts`
- Docs: `docs/LOGIN.md`

## [1.5.5] — WebSocket optimizations
## [1.5.4] — Groups IQ + Media
## [1.5.3] — Stable pairing IQ
