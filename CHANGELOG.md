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
