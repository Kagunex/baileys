# Message Engine (v1.7.0)

## Features

| Feature | Status |
|---------|--------|
| sendMessage E2E (Noise) | 🟡 Partial — protobuf body over session |
| receive / decrypt | 🟡 Partial — node + optional Signal KXS1 |
| protobuf serialization | 🟡 Message subset |
| server ACK | 🟡 parse `ack`/`receipt`, wait optional |
| messages.upsert | ✅ + dedup |
| retry | ✅ send retry x3 |
| quoted/reply | ✅ contextInfo |
| edit / delete / reaction | 🟡 protocolMessage + reactionMessage |

## API

```ts
await sock.sendMessage(jid, { text: "hi" });
await sock.sendMessage(jid, { text: "reply", quoted: prevMsg });
await sock.sendMessage(jid, { react: { text: "👍", key: prevMsg.key } });

// engine helpers (internal / advanced)
import { createMessageEngine } from "@kagunex/baileys";
```

## Events

- `messages.upsert`
- `messages.update` (ACK status, edits)
- `messages.delete` (revoke)
- `messages.reaction`
