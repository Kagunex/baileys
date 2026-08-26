# PRIORITY #1 — Socket & Reconnect (v1.6.1)

## Guarantees

| Requirement | Implementation |
|-------------|----------------|
| No duplicate sockets | `socketId` + generation; stale WS events ignored; connect() no-ops if open/connecting |
| Exponential backoff | Full jitter via `computeReconnectDelayMs` |
| Connection timeout | `connectTimeoutMs` + WS handshake timeout |
| Disconnect reasons | mapped (1006 network, 401 loggedOut, intentional close) |
| Cleanup listeners | `removeAllListeners` + socketId invalidation on replace |
| Keepalive/ping | WS ping every 25s, pong timeout 10s |
| Network recovery | auto-reconnect unless loggedOut / intentional / max retries |
| Don't lose events | `EventBuffer` queues during reconnect, flush on open |

## Flow

```
close → eventBuffer.start()
     → ReconnectManager.onClose(generation)
     → waitBackoff()
     → beginConnect() → transport.connect()  // single flight
open → markOpen() → eventBuffer.flush()
```

## Config

```ts
makeWASocket({
  connectTimeoutMs: 60_000,
  keepAliveIntervalMs: 25_000,
});
```
