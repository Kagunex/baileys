/**
 * Socket configuration and public WASocket interface.
 */
import type { Logger } from "pino";
import type { AuthenticationState } from "./Auth.js";
import type { ConnectionUpdate } from "./Events.js";
import type { EventEmitter } from "../Events/emitter.js";
import type { WAMessage, WAMessageKey, WAMessageSendOptions, AnyMessageContent } from "./Messages.js";
import type { GroupMetadata, GroupParticipantAction } from "./Groups.js";
export type BrowserDescription = [string, string, string];
export type SocketConfig = {
    /** Auth state (creds + key store) */
    auth?: AuthenticationState;
    /** pino logger instance */
    logger?: Logger;
    /** Browser identity [name, browser, os] */
    browser?: BrowserDescription;
    /** WhatsApp Web version tuple */
    version?: [number, number, number];
    /** Print QR to terminal when server sends ref */
    printQRInTerminal?: boolean;
    /** Custom WebSocket URL (default wss://web.whatsapp.com/ws/chat) */
    waWebSocketUrl?: string | URL;
    /** Connect timeout ms */
    connectTimeoutMs?: number;
    /** Keep-alive interval ms */
    keepAliveIntervalMs?: number;
    /** Default query timeout */
    defaultQueryTimeoutMs?: number;
    /** Mark online on connect */
    markOnlineOnConnect?: boolean;
    /** Sync full history */
    syncFullHistory?: boolean;
    /** Generate high-quality link previews */
    generateHighQualityLinkPreview?: boolean;
    /** Custom agent / proxy */
    agent?: unknown;
    /** Should ignore a jid for messages */
    shouldIgnoreJid?: (jid: string) => boolean | undefined;
    /** QR timeout ms */
    qrTimeout?: number;
    [key: string]: unknown;
};
export type WASocket = {
    ev: EventEmitter;
    authState?: AuthenticationState;
    readonly user?: {
        id: string;
        name?: string;
        lid?: string;
    } | undefined;
    sendMessage(jid: string, content: AnyMessageContent | import("./Messages.js").WAMessageContent, options?: WAMessageSendOptions): Promise<WAMessage>;
    sendReaction(key: WAMessageKey, emoji: string): Promise<WAMessage>;
    sendRevoke(key: WAMessageKey): Promise<WAMessage>;
    sendEdit(key: WAMessageKey, text: string): Promise<WAMessage>;
    sendChatState(jid: string, chatState: "composing" | "recording" | "paused"): Promise<void>;
    sendPresenceUpdate(type: "available" | "unavailable" | "composing" | "recording" | "paused", jid?: string): Promise<void>;
    /**
     * Wait until Noise handshake is complete and client payload has been sent.
     * Required before requestPairingCode can succeed. No fixed delay — resolves
     * on real protocol readiness (or rejects on close / timeout / handshake failure).
     */
    waitForPairingReady(timeoutMs?: number): Promise<void>;
    /**
     * Request a pairing code. Internally waits for pairing readiness
     * (completed Noise handshake + client payload) before sending the IQ.
     * Rejects with PAIRING_ALREADY_IN_PROGRESS if another pairing is active.
     * Rejects if session is already registered.
     */
    requestPairingCode(phoneNumber: string, timeoutMs?: number): Promise<string>;
    groupCreate(subject: string, participants: string[]): Promise<GroupMetadata>;
    groupMetadata(jid: string): Promise<GroupMetadata>;
    groupParticipantsUpdate(jid: string, participants: string[], action: GroupParticipantAction): Promise<unknown>;
    groupUpdateSubject(jid: string, subject: string): Promise<void>;
    groupUpdateDescription(jid: string, description?: string): Promise<void>;
    groupInviteCode(jid: string): Promise<string | undefined>;
    groupRevokeInvite(jid: string): Promise<string | undefined>;
    groupLeave(jid: string): Promise<void>;
    onWhatsApp(...jids: string[]): Promise<Array<{
        jid: string;
        exists: boolean;
    } | undefined>>;
    fetchStatus(jid: string): Promise<{
        status?: string;
        setAt?: Date;
    } | undefined>;
    presenceSubscribe(jid: string): Promise<void>;
    end(error?: Error): void;
    logout(): Promise<void>;
    waitForConnectionUpdate(check: (update: ConnectionUpdate) => boolean | undefined, timeoutMs?: number): Promise<void>;
};
//# sourceMappingURL=Socket.d.ts.map