import pino from "pino";
import { EventEmitter } from "../Events/emitter.js";
import { createInitialState } from "./state.js";
import { createConnectionController } from "./connection.js";
import { createMessageEngine } from "../Messages/engine.js";
import * as Groups from "../Groups/index.js";
import * as Contacts from "../Contacts/index.js";
import { normalizePairingPhone } from "../Web/pairing.js";
import { AuthenticationError } from "../Errors/errors.js";
import { DEFAULT_BROWSER } from "../Defaults/browser.js";
import { promiseTimeout } from "../Utils/timeout.js";
import { buildChatstateNode, buildPresenceNode, } from "../Protocol/chatstate.js";
function resolveLogger(config) {
    return config.logger ?? pino({ level: "info" });
}
export function makeWASocket(config = {}) {
    const logger = resolveLogger(config);
    const ev = new EventEmitter();
    const state = createInitialState(config.auth);
    logger.debug({ browser: config.browser ?? DEFAULT_BROWSER }, "makeWASocket init");
    const connection = createConnectionController(config, state, ev, logger);
    connection.start();
    const messageEngine = createMessageEngine({
        ev,
        userJid: state.user?.id,
        logger,
        waitForAck: true,
    });
    connection.setPayloadHandler?.((payload) => {
        const session = connection.getSession();
        messageEngine.handlePayload(payload, undefined, undefined, session
            ? {
                session,
                sendFrame: (frame) => connection.transport.send(frame),
            }
            : undefined);
    });
    const requireNet = () => {
        const session = connection.getSession();
        if (!session)
            throw new Error("not connected (no Noise session)");
        return {
            session,
            sendFrame: (frame) => connection.transport.send(frame),
            iq: connection.getIq(),
        };
    };
    const optionalNet = () => {
        const session = connection.getSession();
        if (!session)
            return undefined;
        return {
            session,
            sendFrame: (frame) => connection.transport.send(frame),
        };
    };
    const sock = {
        ev,
        authState: config.auth,
        get user() {
            return state.user;
        },
        async sendMessage(jid, content, options) {
            return messageEngine.sendMessage(jid, content, { ...options, userJid: state.user?.id }, optionalNet());
        },
        async sendReaction(key, emoji) {
            return messageEngine.sendReaction(key, emoji, optionalNet());
        },
        async sendRevoke(key) {
            return messageEngine.sendRevoke(key, optionalNet());
        },
        async sendEdit(key, text) {
            return messageEngine.sendEdit(key, text, optionalNet());
        },
        async sendChatState(jid, chatState) {
            const net = requireNet();
            const { encoded } = buildChatstateNode(jid, chatState);
            net.sendFrame(net.session.seal(encoded));
        },
        async sendPresenceUpdate(type, jid) {
            const net = requireNet();
            const { encoded } = buildPresenceNode(type, jid);
            net.sendFrame(net.session.seal(encoded));
        },
        async waitForPairingReady(timeoutMs = 60_000) {
            return connection.waitForPairingReady(timeoutMs);
        },
        async requestPairingCode(phoneNumber, timeoutMs = 60_000) {
            const phone = normalizePairingPhone(phoneNumber);
            logger.info({ phone }, "requestPairingCode");
            // requestPairingCode itself waits for Noise + client payload readiness
            return connection.requestPairingCode(phone, timeoutMs);
        },
        groupCreate: (subject, participants) => Groups.groupCreate(subject, participants, requireNet()),
        groupMetadata: (jid) => Groups.groupMetadata(jid, requireNet()),
        groupParticipantsUpdate: (jid, participants, action) => Groups.groupParticipantsUpdate(jid, participants, action, requireNet()),
        groupUpdateSubject: (jid, subject) => Groups.groupUpdateSubject(jid, subject, requireNet()),
        groupUpdateDescription: (jid, description) => Groups.groupUpdateDescription(jid, description, requireNet()),
        groupInviteCode: (jid) => Groups.groupInviteCode(jid, requireNet()),
        groupRevokeInvite: (jid) => Groups.groupRevokeInvite(jid, requireNet()),
        groupLeave: (jid) => Groups.groupLeave(jid, requireNet()),
        onWhatsApp: (...jids) => Contacts.onWhatsApp(jids, requireNet()),
        fetchStatus: (jid) => Contacts.fetchStatus(jid),
        presenceSubscribe: (jid) => Contacts.presenceSubscribe(jid, requireNet()),
        end(error) {
            messageEngine.dispose();
            connection.stop(error);
        },
        async logout() {
            if (config.auth) {
                config.auth.creds.registered = false;
                ev.emit("creds.update", { registered: false });
            }
            connection.stop(new AuthenticationError("Logged out"));
        },
        async waitForConnectionUpdate(check, timeoutMs = 60_000) {
            return promiseTimeout(timeoutMs, new Promise((resolve, reject) => {
                const listener = (update) => {
                    try {
                        if (check(update)) {
                            ev.off("connection.update", listener);
                            resolve();
                        }
                    }
                    catch (err) {
                        ev.off("connection.update", listener);
                        reject(err);
                    }
                };
                ev.on("connection.update", listener);
            }), "waitForConnectionUpdate timed out");
        },
    };
    return sock;
}
export default makeWASocket;
//# sourceMappingURL=socket.js.map