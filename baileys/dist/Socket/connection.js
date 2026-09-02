import { emitConnectionUpdate } from "./events.js";
import { WebSocketTransport } from "./transport.js";
import { DEFAULT_CONNECT_TIMEOUT_MS, DEFAULT_KEEP_ALIVE_INTERVAL_MS, DEFAULT_WS_HANDSHAKE_TIMEOUT_MS, DEFAULT_WS_PING_INTERVAL_MS, DEFAULT_WS_PONG_TIMEOUT_MS, DEFAULT_MAX_RECONNECT, DEFAULT_RX_BUFFER_MAX, } from "../Defaults/constants.js";
import { DEFAULT_RECONNECT } from "./reconnect.js";
import { createReconnectManager } from "./reconnect-manager.js";
import { EventBuffer } from "../Events/buffer.js";
import { startWaNoiseHandshake, continueWaNoiseHandshake, waNoiseKeyFromCreds, } from "../Noise/wa-noise.js";
import { decodeFrame } from "../WABinary/frame.js";
import { initAuthCreds } from "../Auth/credentials.js";
import { encodeClientPayload } from "../Protocol/client-payload.js";
import { parseProtocolPayload } from "../Protocol/handler.js";
import { parsePairingPayload } from "../Protocol/pairing.js";
import { detectDisconnectFromPayload, applyPairSuccess, applyLoggedOut, buildQrFromServerRef, shouldSkipPairingOnReconnect, resolveLoginMode, } from "./login-lifecycle.js";
import { createPairingController } from "./pairing-controller.js";
import { createIqController } from "./iq-controller.js";
import { printQRInTerminal } from "../Web/qr.js";
/**
 * Connection lifecycle:
 * WebSocket → Noise XX → client payload → parse server nodes (QR ref if real).
 */
export function createConnectionController(config, state, ev, logger) {
    let keepAliveTimer;
    let connectTimer;
    let stopped = false;
    let reconnectAttempt = 0;
    const maxReconnect = DEFAULT_MAX_RECONNECT;
    let rxBufBytes = 0;
    let noiseState;
    let phase = "idle";
    let session;
    let rxBuf = Buffer.alloc(0);
    const pairing = createPairingController(logger);
    const iq = createIqController(logger);
    const rm = createReconnectManager(logger, {
        ...DEFAULT_RECONNECT,
        maxRetries: DEFAULT_MAX_RECONNECT,
    });
    const eventBuffer = new EventBuffer(500);
    let activeGen = 0;
    let payloadHandler;
    let readyWaiters = [];
    const isPairingReady = () => !!session && (phase === "login_sent" || phase === "noise_done");
    const settleReadyWaiters = (err) => {
        if (readyWaiters.length === 0)
            return;
        const list = readyWaiters;
        readyWaiters = [];
        for (const w of list) {
            if (w.timer)
                clearTimeout(w.timer);
            if (err)
                w.reject(err);
            else
                w.resolve();
        }
    };
    const waitForPairingReady = (timeoutMs = 60_000) => {
        if (isPairingReady())
            return Promise.resolve();
        if (phase === "failed" || state.connection === "close") {
            return Promise.reject(new Error("PAIRING FAILED: socket closed or Noise handshake failed before pairing readiness"));
        }
        return new Promise((resolve, reject) => {
            const waiter = {
                resolve: () => resolve(),
                reject,
                timer: null,
            };
            if (timeoutMs > 0) {
                waiter.timer = setTimeout(() => {
                    waiter.timer = null;
                    const idx = readyWaiters.indexOf(waiter);
                    if (idx >= 0)
                        readyWaiters.splice(idx, 1);
                    reject(new Error(`PAIRING FAILED: timed out waiting for Noise handshake + client payload (${timeoutMs}ms)`));
                }, timeoutMs);
            }
            readyWaiters.push(waiter);
            // Re-check in case readiness flipped between the isPairingReady check and push
            if (isPairingReady()) {
                settleReadyWaiters();
            }
        });
    };
    const safeConnectionUpdate = (update) => {
        emitConnectionUpdate(ev, update, eventBuffer);
    };
    const clearTimers = () => {
        if (keepAliveTimer) {
            clearInterval(keepAliveTimer);
            keepAliveTimer = undefined;
        }
        if (connectTimer) {
            clearTimeout(connectTimer);
            connectTimer = undefined;
        }
    };
    const ensureNoiseKey = () => {
        if (!state.auth) {
            return waNoiseKeyFromCreds(initAuthCreds().noiseKey);
        }
        return waNoiseKeyFromCreds(state.auth.creds.noiseKey);
    };
    const sendClientPayload = () => {
        if (!session)
            return;
        const creds = state.auth?.creds;
        const registered = shouldSkipPairingOnReconnect(creds);
        const username = registered ? creds?.me?.id : undefined;
        const payload = encodeClientPayload({
            version: config.version,
            browser: config.browser,
            username,
            passive: !registered,
        });
        const frame = session.seal(payload);
        transport.send(frame);
        phase = "login_sent";
        logger?.info({
            bytes: payload.length,
            mode: resolveLoginMode(creds),
            registered,
        }, "sent client payload after Noise");
        // Noise handshake complete + client payload sent → pairing is allowed
        settleReadyWaiters();
    };
    const handleDecrypted = (pt) => {
        // Pairing IQ / notifications
        pairing.onPayload(pt);
        iq.onPayload(pt);
        payloadHandler?.(pt);
        // --- PRIORITY #1: login lifecycle (loggedOut / pair-success / QR) ---
        const disc = detectDisconnectFromPayload(pt);
        if (disc) {
            logger?.warn({ disc }, "disconnect signal from payload");
            if (disc.isLoggedOut && state.auth) {
                const patch = applyLoggedOut(state.auth.creds);
                Object.assign(state.auth.creds, patch);
                state.user = undefined;
                ev.emit("creds.update", patch);
            }
            state.connection = "close";
            state.lastDisconnect = { error: disc, date: new Date() };
            // Cancel in-flight pairing so no stale resolve after disconnect
            pairing.cancelAll(disc.isLoggedOut ? "logged out" : "connection closed");
            safeConnectionUpdate({
                connection: "close",
                lastDisconnect: state.lastDisconnect,
            });
            // loggedOut → do not auto-reconnect as registered
            if (disc.isLoggedOut) {
                stopped = true;
                transport.close(1000, "logged-out");
                return;
            }
        }
        {
            const pairingParsed = parsePairingPayload(pt);
            // Only persist pairingCode when a pairing flow is active (matched IQ path).
            // Unsolicited / stale codes must not mutate auth state.
            if (pairingParsed.code && state.auth && pairing.isBusy()) {
                state.auth.creds.pairingCode = pairingParsed.code.replace("-", "");
                ev.emit("creds.update", { pairingCode: state.auth.creds.pairingCode });
            }
            const applied = applyPairSuccess(pairingParsed, state.auth?.creds);
            if (applied && state.auth) {
                Object.assign(state.auth.creds, applied.credsPatch);
                if (applied.credsPatch.me) {
                    state.user = {
                        id: applied.credsPatch.me.id,
                        name: applied.credsPatch.me.name,
                    };
                }
                ev.emit("creds.update", applied.credsPatch);
                state.connection = "open";
                safeConnectionUpdate(applied.connectionUpdate);
                // Pairing finished — drop any outstanding code waiters
                pairing.cancelAll("pair-success");
                logger?.info({ me: state.user?.id }, "pair-success — credentials updated (persist via saveCreds); native Linked Devices notification is handled by WhatsApp");
                // Allow reconnect without pairing on next connection
                reconnectAttempt = 0;
            }
        }
        const parsed = parseProtocolPayload(pt);
        if (parsed.nodes.length) {
            logger?.debug({ tags: parsed.nodes.map((n) => n.tag), qrRefs: parsed.qrRefs.length }, "protocol node(s)");
        }
        else {
            logger?.trace({ bytes: pt.length }, "non-node decrypted frame");
        }
        if (parsed.streamError) {
            logger?.warn({ streamError: parsed.streamError }, "stream/iq error");
        }
        // Only emit QR when server actually provided a ref
        for (const ref of parsed.qrRefs) {
            const creds = state.auth?.creds;
            if (!creds) {
                logger?.warn("got server ref but no auth creds to compose QR");
                continue;
            }
            const qr = buildQrFromServerRef(ref, creds);
            if (!qr)
                continue;
            state.qr = qr;
            safeConnectionUpdate({
                connection: "connecting",
                qr,
                isNewLogin: !creds.registered,
            });
            if (config.printQRInTerminal) {
                printQRInTerminal(qr);
            }
            logger?.info("emitted QR from server ref (real ref, local keys)");
        }
        // Open only when auth is actually registered (pair-success applied above,
        // or a registered session received a protocol success). Bare pairSuccess
        // without valid applyPairSuccess must not open the connection.
        const authReady = !!state.auth?.creds.registered && !!state.auth?.creds.me?.id;
        if (authReady && (parsed.pairSuccess || parsed.success)) {
            state.connection = "open";
            safeConnectionUpdate({
                connection: "open",
                isNewLogin: !!parsed.pairSuccess,
            });
            logger?.info("connection marked open after protocol success (auth ready)");
        }
    };
    const onHandshakeBytes = (chunk) => {
        if (!noiseState || phase === "failed")
            return;
        rxBuf = Buffer.concat([rxBuf, chunk]);
        if (rxBuf.length > DEFAULT_RX_BUFFER_MAX) {
            logger?.error({ len: rxBuf.length }, "rx buffer overflow during handshake");
            phase = "failed";
            settleReadyWaiters(new Error("PAIRING FAILED: buffer overflow during Noise handshake"));
            transport.close(1009, "buffer-overflow");
            return;
        }
        if (phase === "sent_e") {
            const framed = decodeFrame(rxBuf);
            if (!framed)
                return;
            rxBuf = Buffer.from(framed.rest);
            try {
                const cont = continueWaNoiseHandshake(noiseState, framed.payload);
                if (cont.cert.ok)
                    logger?.info("Noise certificate signature OK");
                else if (cont.serverPayload.length)
                    logger?.warn({ reason: cont.cert.reason }, "Noise certificate validation");
                transport.send(cont.finishFrame);
                session = cont.session;
                phase = "noise_done";
                logger?.info("Noise XX (WA): handshake complete — sending client payload");
                safeConnectionUpdate({
                    connection: "connecting",
                    isNewLogin: !state.auth?.creds.registered,
                });
                sendClientPayload();
            }
            catch (err) {
                phase = "failed";
                logger?.error({ err }, "Noise XX: handshake failed");
                state.lastDisconnect = {
                    error: err instanceof Error ? err : new Error(String(err)),
                    date: new Date(),
                };
                settleReadyWaiters(err instanceof Error
                    ? err
                    : new Error("PAIRING FAILED: Noise handshake failed"));
                safeConnectionUpdate({
                    connection: "close",
                    lastDisconnect: state.lastDisconnect,
                });
                transport.close(1000, "noise-failed");
            }
            return;
        }
    };
    const transport = new WebSocketTransport({
        onOpen: () => {
            if (!rm.isCurrent(activeGen)) {
                logger?.debug({ activeGen, gen: rm.generation }, "stale onOpen ignored");
                return;
            }
            clearTimers();
            phase = "idle";
            session = undefined;
            rxBuf = Buffer.alloc(0);
            noiseState = undefined;
            rm.markOpen(activeGen);
            const flushed = eventBuffer.flush(ev);
            if (flushed)
                logger?.info({ flushed }, "flushed buffered events after reconnect");
            logger?.info({ generation: activeGen }, "WebSocket open — starting Noise XX");
            state.connection = "connecting";
            safeConnectionUpdate({ connection: "connecting" });
            try {
                const started = startWaNoiseHandshake({ staticKey: ensureNoiseKey() });
                noiseState = started.state;
                transport.send(started.firstFrame);
                phase = "sent_e";
                logger?.info("Noise XX (WA): sent ephemeral message 1");
            }
            catch (err) {
                phase = "failed";
                logger?.error({ err }, "Noise XX: failed to start");
                settleReadyWaiters(err instanceof Error
                    ? err
                    : new Error("PAIRING FAILED: Noise handshake failed to start"));
            }
            // Application-level keep-alive: optional presence when session exists.
            // Transport already sends WebSocket ping/pong.
            const interval = config.keepAliveIntervalMs ?? DEFAULT_KEEP_ALIVE_INTERVAL_MS;
            keepAliveTimer = setInterval(() => {
                if (!session || !transport.isOpen)
                    return;
                try {
                    // lightweight empty seal keeps Noise counters active on some paths
                    logger?.trace({ write: session.writeCounter }, "app keep-alive tick");
                }
                catch {
                    /* */
                }
            }, interval);
            if (typeof keepAliveTimer === "object" && "unref" in keepAliveTimer) {
                keepAliveTimer.unref?.();
            }
        },
        onClose: (code, reason) => {
            clearTimers();
            phase = "idle";
            session = undefined;
            state.connection = "close";
            state.lastDisconnect = {
                error: { code, message: reason },
                date: new Date(),
            };
            settleReadyWaiters(new Error(`PAIRING FAILED: connection closed before pairing readiness (${code}: ${reason || "closed"})`));
            // Buffer subsequent events until reconnected
            eventBuffer.start();
            safeConnectionUpdate({
                connection: "close",
                lastDisconnect: state.lastDisconnect,
            });
            const decision = rm.onClose(activeGen, {
                intentional: transport.wasIntentionalClose,
                stopped,
                code,
                reasonText: reason,
            });
            if (!decision.should) {
                if (decision.reason === "max retries") {
                    logger?.warn({ generation: activeGen }, "reconnect exhausted");
                }
                eventBuffer.stop();
                return;
            }
            void (async () => {
                const waited = await rm.waitBackoff();
                if (waited < 0 || stopped || !rm.isCurrent(activeGen) && rm.generation !== activeGen) {
                    // generation may advance — allow if not stopped
                }
                if (stopped) {
                    eventBuffer.clear();
                    return;
                }
                // Single-flight: only one connect
                if (transport.isOpen || transport.isConnecting) {
                    logger?.debug("skip reconnect connect — already open/connecting");
                    return;
                }
                activeGen = rm.beginConnect();
                state.connection = "connecting";
                safeConnectionUpdate({ connection: "connecting" });
                try {
                    transport.connect();
                }
                catch (err) {
                    logger?.error({ err }, "reconnect connect failed");
                }
            })();
        },
        onError: (err) => {
            logger?.error({ err: err.message }, "connection error");
            state.lastDisconnect = { error: err, date: new Date() };
        },
        onMessage: (data) => {
            if (phase === "sent_e") {
                onHandshakeBytes(data);
                return;
            }
            if ((phase === "noise_done" || phase === "login_sent") && session) {
                try {
                    const payloads = session.open(data);
                    for (const pt of payloads)
                        handleDecrypted(pt);
                }
                catch (err) {
                    logger?.error({ err }, "decrypt/protocol failed");
                }
                return;
            }
        },
    }, logger, {
        handshakeTimeoutMs: config.connectTimeoutMs
            ? Math.min(config.connectTimeoutMs, DEFAULT_WS_HANDSHAKE_TIMEOUT_MS)
            : DEFAULT_WS_HANDSHAKE_TIMEOUT_MS,
        pingIntervalMs: config.keepAliveIntervalMs ?? DEFAULT_WS_PING_INTERVAL_MS,
        pongTimeoutMs: DEFAULT_WS_PONG_TIMEOUT_MS,
    });
    const requestPairingCode = async (phoneNumber, timeoutMs = 60_000) => {
        // Registered sessions must resume without requesting a new pairing code
        if (state.auth?.creds?.registered === true) {
            throw new Error("PAIRING FAILED: already registered — use existing session (do not request pairing code)");
        }
        // Wait for real readiness: completed Noise handshake + client payload sent.
        // No fixed delay — resolves when sendClientPayload() runs (or rejects on close/fail).
        if (!isPairingReady()) {
            logger?.info("requestPairingCode: waiting for Noise handshake + client payload");
            await waitForPairingReady(timeoutMs);
        }
        if (!session || !isPairingReady()) {
            throw new Error("PAIRING FAILED: requestPairingCode requires completed Noise handshake + client payload");
        }
        return pairing.requestCode(phoneNumber, {
            timeoutMs,
            session,
            send: (plaintext) => {
                transport.send(session.seal(plaintext));
            },
            creds: state.auth?.creds,
        });
    };
    return {
        transport,
        getSession: () => session,
        isPairingReady,
        waitForPairingReady,
        requestPairingCode,
        sendPlaintext: (plaintext) => {
            if (!session)
                throw new Error("no Noise session — not connected");
            transport.send(session.seal(plaintext));
        },
        getIq: () => iq,
        setPayloadHandler: (handler) => {
            payloadHandler = handler;
        },
        start() {
            stopped = false;
            rm.cancel(); // clear prior
            // re-enable manager
            activeGen = rm.beginConnect();
            state.connection = "connecting";
            safeConnectionUpdate({ connection: "connecting" });
            const timeout = config.connectTimeoutMs ?? DEFAULT_CONNECT_TIMEOUT_MS;
            connectTimer = setTimeout(() => {
                transport.close(1000, "timeout");
                state.connection = "close";
                state.lastDisconnect = {
                    error: { code: 408, message: "Connection timeout" },
                    date: new Date(),
                };
                settleReadyWaiters(new Error("PAIRING FAILED: connection timeout before pairing readiness"));
                safeConnectionUpdate({
                    connection: "close",
                    lastDisconnect: state.lastDisconnect,
                });
            }, timeout);
            try {
                transport.connect();
            }
            catch (err) {
                clearTimers();
                state.connection = "close";
                state.lastDisconnect = {
                    error: err instanceof Error ? err : new Error(String(err)),
                    date: new Date(),
                };
                settleReadyWaiters(err instanceof Error
                    ? err
                    : new Error("PAIRING FAILED: failed to open WebSocket"));
                safeConnectionUpdate({
                    connection: "close",
                    lastDisconnect: state.lastDisconnect,
                });
            }
        },
        stop(error) {
            stopped = true;
            rm.cancel();
            eventBuffer.clear();
            pairing.cancelAll("connection stopped");
            iq.cancelAll("connection stopped");
            clearTimers();
            settleReadyWaiters(error ?? new Error("PAIRING FAILED: connection stopped before pairing readiness"));
            transport.close();
            session = undefined;
            phase = "idle";
            state.connection = "close";
            if (error)
                state.lastDisconnect = { error, date: new Date() };
            safeConnectionUpdate({
                connection: "close",
                lastDisconnect: state.lastDisconnect,
            });
        },
    };
}
//# sourceMappingURL=connection.js.map