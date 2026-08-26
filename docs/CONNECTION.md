# WebSocket connection optimizations (v1.5.5)

## Transport (`WebSocketTransport`)

- `perMessageDeflate: false` — less CPU on binary frames
- `skipUTF8Validation: true`
- Handshake timeout (default 20s)
- Protocol **ping/pong** every 25s; terminate if no pong in 10s
- Guard against concurrent `connect()`
- Binary send (`compress: false`)
- Backpressure log when `bufferedAmount` > 2MB
- `terminate()` for fast failover

## Reconnect

- Exponential backoff with **full jitter**
- Default max 8 attempts, base 800ms, cap 30s
- Skips reconnect on intentional close

## Buffer

- Handshake RX buffer capped at 8MB

## Config hooks

```ts
makeWASocket({
  connectTimeoutMs: 60_000,
  keepAliveIntervalMs: 25_000, // also drives WS ping interval
})
```
