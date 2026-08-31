# Security Policy

## Supported Versions

This library is experimental. Treat all releases as potentially incomplete regarding protocol security until Noise handshake and Signal sessions are fully implemented.

## Reporting a Vulnerability

Report security issues privately to the maintainers. Do not open public issues that expose credential handling flaws with exploit details.

## Credential Handling

- Auth state (`creds.json`, signal keys) is secret material.
- Never commit `auth/` directories or credential files.
- Never log private keys, noise keys, or session keys.
- Use the library only on accounts and devices you are authorized to access.

## Scope

KaguneX Baileys is not a backdoor, RAT, or session stealer. Contributions that add hidden persistence, credential exfiltration, or unauthorized remote control will be rejected.
