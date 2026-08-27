import type { Logger } from "pino";
import type { AuthenticationState } from "./Auth.js";
import type {
  AnyMessageContent,
  WAMessage,
  WAMessageKey,
  WAMessageSendOptions,
} from "./Messages.js";
import type { GroupMetadata, GroupModificationResponse, GroupParticipantAction } from "./Groups.js";
import type { ConnectionUpdate } from "./Events.js";

export type BrowserDescription = [string, string, string];

export interface SocketConfig {
  auth?: AuthenticationState;
  logger?: Logger;
  browser?: BrowserDescription;
  printQRInTerminal?: boolean;
  connectTimeoutMs?: number;
  defaultQueryTimeoutMs?: number;
  keepAliveIntervalMs?: number;
  retryRequestDelayMs?: number;
  markOnlineOnConnect?: boolean;
  version?: [number, number, number];
}

export type WASocket = {
  ev: import("../Events/emitter.js").EventEmitter;
  authState?: AuthenticationState;
  user?: { id: string; name?: string; lid?: string };

  sendMessage: (
    jid: string,
    content: AnyMessageContent,
    options?: WAMessageSendOptions,
  ) => Promise<WAMessage>;

  /** React to a message */
  sendReaction: (key: WAMessageKey, emoji: string) => Promise<WAMessage>;
  /** Delete/revoke for everyone */
  sendRevoke: (key: WAMessageKey) => Promise<WAMessage>;
  /** Edit text message */
  sendEdit: (key: WAMessageKey, text: string) => Promise<WAMessage>;

  /** Typing indicators */
  sendChatState: (
    jid: string,
    state: "composing" | "paused" | "recording",
  ) => Promise<void>;
  sendPresenceUpdate: (
    type: "available" | "unavailable",
    jid?: string,
  ) => Promise<void>;

  requestPairingCode: (phoneNumber: string) => Promise<string>;

  groupCreate: (subject: string, participants: string[]) => Promise<GroupMetadata>;
  groupMetadata: (jid: string) => Promise<GroupMetadata>;
  groupParticipantsUpdate: (
    jid: string,
    participants: string[],
    action: GroupParticipantAction,
  ) => Promise<GroupModificationResponse>;
  groupUpdateSubject: (jid: string, subject: string) => Promise<void>;
  groupUpdateDescription: (jid: string, description?: string) => Promise<void>;
  groupInviteCode: (jid: string) => Promise<string>;
  groupRevokeInvite: (jid: string) => Promise<string>;
  groupLeave: (jid: string) => Promise<void>;

  onWhatsApp: (
    ...jids: string[]
  ) => Promise<Array<{ jid: string; exists: boolean } | undefined>>;
  fetchStatus: (
    jid: string,
  ) => Promise<{ status?: string; setAt?: Date } | undefined>;
  presenceSubscribe: (jid: string) => Promise<void>;

  end: (error?: Error) => void;
  logout: () => Promise<void>;
  waitForConnectionUpdate: (
    check: (u: ConnectionUpdate) => boolean | undefined,
    timeoutMs?: number,
  ) => Promise<void>;
};
