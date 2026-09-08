# WAProto

Placeholder for extracted WhatsApp `.proto` definitions and generated TypeScript.

## Status

KaguneX currently uses:

1. **WABinary** nodes for stream/IQ/message stanzas
2. **`src/WAProto/message-codec.ts`** — interim envelope for text payloads (KaguneX format)

This is **not** byte-compatible with official WhatsApp protobuf until real schemas are extracted via `proto-extract/` and generated here.

## Target layout (future)

```
WAProto/
  *.proto
  generated/
    index.ts
```

Do not commit account data or credentials into this folder.
