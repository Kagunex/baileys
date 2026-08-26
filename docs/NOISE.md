# Noise Protocol (WhatsApp Web style)

## Pattern

`Noise_XX_25519_AESGCM_SHA256`

```
-> e
<- e, ee, s, es   (+ optional cert payload)
-> s, se          (+ optional client payload)
```

## Prologue

Default: `NOISE_MODE` = `Noise_XX_25519_AESGCM_SHA256\0\0\0\0` (binary).

## Frames

Handshake and transport use **3-byte big-endian length** prefix (`encodeFrame` / `decodeFrame`).

Transport ciphertext = AES-256-GCM(plaintext) with Noise nonce  
`(0x00000000 || uint64_be counter)`.

## API

```ts
import {
  startWaNoiseHandshake,
  continueWaNoiseHandshake,
  waNoiseKeyFromCreds,
} from "@kagunex/baileys";
```

Socket connection runs this automatically on WebSocket open.

## Certificate

Server payload after static key may include a cert blob.  
Validate with `validateNoiseCertificate(payload, trustedKeys)`.  
No CA keys are bundled by default.
