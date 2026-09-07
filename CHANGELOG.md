# Changelog

All notable changes to this project will be documented in this file.

## [1.8.5] - 2026-09-02

### Fixed / Updated

- Bump package version to 1.8.5
- Align `scripts/verify-package.mjs` version check with 1.8.5
- Remove leftover backup file (`pairing-controller.ts.bak`)
- Ensure package metadata files (README, LICENSE, CHANGELOG, SECURITY) are present
- Preserve existing pairing readiness implementation (`waitForPairingReady`, `isPairingReady`, `requestPairingCode`)
- Maintain single active pairing lock, IQ ID matching, timeout/cleanup, and phone number normalization

### Notes

- No protocol or crypto changes.
- Pairing readiness continues to be driven by real Noise handshake + client payload state (no fixed artificial delays).

## [1.8.4] - 2026-08-31

- Pairing-ready release with waitForPairingReady / isPairingReady / requestPairingCode

## [1.8.3] - previous

- Earlier baseline

## [1.8.5-rc3] — 2026-09-07

### Fixed
- **Noise handshake root causes** (RC1 → RC3):
  - Bug #1: `initializeHash` used SHA-256 of 28-byte protocol name instead of
    zero-padding to 32 bytes per Noise spec §3.4. This corrupted `h0`/`ck`,
    making all AES-GCM keys wrong.
  - Bug #2: Prologue was `NOISE_MODE` (32 bytes) instead of `NOISE_WA_HEADER`
    (4 bytes `"WA\x06\x03"`).
  - Bug #3: `NOISE_WA_HEADER` was mixed into `h` a second time after init
    (double-mix), diverging from the server's hash state.
  - Bug #4: `ClientHello` omitted the static public key (field 2). New/
    unregistered devices' servers could not sync their `h` state, causing
    AES-GCM authentication tag mismatch.

### Changed
- **ClientPayload**: Replaced WABinary (binary XML) encoding with proper
  protobuf encoding as expected by the WhatsApp server after the Noise
  handshake. Implemented `encodeClientPayload` using documented proto field
  numbers (ClientPayload, UserAgent, WebInfo, DevicePairingRegistrationData).
- Added `encodeVarint64` to `WAProto/protobuf.ts` for uint64 phone number
  encoding in `ClientPayload.username`.

### Added
- 4 regression tests covering all Noise initialization bugs (REG-1 to REG-4).

### Unchanged
- Pairing controller: all 17 tests continue to pass.
- WebSocket transport: no changes.
- WABinary frame codec: no changes.

## [1.8.5-rc4] — 2026-09-07

### Changed
- Version bump rc3 → rc4.
- No code changes from rc3; all rc3 fixes carry over.
