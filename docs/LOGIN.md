# PRIORITY #1 — Pairing Code + QR Login

## Modes

| Mode | Condition | Behavior |
|------|-----------|----------|
| `qr` | not registered | Wait for server `ref` → emit `connection.update.qr` |
| `pairing` | has `pairingCode` or user calls `requestPairingCode` | IQ companion_hello + retry/timeout |
| `registered` | `creds.registered && creds.me` | Client payload with username, **no pairing** |

## Persist credentials

```ts
const { state, saveCreds } = await useMultiFileAuthState("./auth");
sock.ev.on("creds.update", async () => {
  await saveCreds();
});
```

After `pair-success`, library sets `registered: true` and `me`.  
**You must `saveCreds()`** so restart skips pairing.

## Pairing

```ts
const code = await sock.requestPairingCode("628xxxxxxxx");
// timeout default 60s, max 3 attempts with backoff
```

## QR

Emitted only when server sends a real `ref` (never faked):

```ts
sock.ev.on("connection.update", (u) => {
  if (u.qr) console.log("scan", u.qr);
});
```

## loggedOut

Stream error `401` / `logged out` → `lastDisconnect.error.isLoggedOut === true`,  
creds cleared (`registered: false`), auto-reconnect as registered **stopped**.

## Reconnect without pairing

1. Login once (QR or pairing)  
2. `saveCreds()`  
3. Restart app with same `./auth`  
4. Noise + client payload with `username` → mode `registered`

## Honest limits

Server acceptance of pairing IQ / QR still depends on live WA protocol alignment.  
Client lifecycle (timeout, retry, persist, loggedOut, skip pairing when registered) is implemented and tested locally.
