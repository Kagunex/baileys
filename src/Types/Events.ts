/**
 * Connection / event map types.
 */

export type ConnectionState = "open" | "connecting" | "close";

export type DisconnectReason = {
  code?: number | string;
  statusCode?: number;
  message?: string;
  isLoggedOut?: boolean;
  error?: Error;
};

export type ConnectionUpdate = {
  connection?: ConnectionState;
  lastDisconnect?: {
    error?: Error | DisconnectReason | unknown;
    date?: Date;
  };
  qr?: string;
  isNewLogin?: boolean;
  receivedPendingNotifications?: boolean;
  isOnline?: boolean;
  [key: string]: unknown;
};

export type BaileysEventMap = {
  "connection.update": ConnectionUpdate;
  "creds.update": Partial<import("./Auth.js").AuthenticationCreds>;
  "messages.upsert": {
    messages: import("./Messages.js").WAMessage[];
    type: "notify" | "append" | "prepend";
  };
  "messages.update": Array<{
    key: import("./Messages.js").WAMessageKey;
    update: Partial<import("./Messages.js").WAMessage>;
  }>;
  "messages.reaction": Array<{
    key: import("./Messages.js").WAMessageKey;
    reaction: { text?: string; key?: import("./Messages.js").WAMessageKey };
  }>;
  "messages.delete":
    | { keys: import("./Messages.js").WAMessageKey[] }
    | { jid: string; all: true };
  "message-receipt.update": unknown[];
  "presence.update": {
    id: string;
    presences: { [participant: string]: { lastKnownPresence?: string; lastSeen?: number } };
  };
  "chats.upsert": unknown[];
  "chats.update": unknown[];
  "chats.delete": string[];
  "contacts.upsert": import("./Auth.js").Contact[];
  "contacts.update": Partial<import("./Auth.js").Contact>[];
  "groups.upsert": import("./Groups.js").GroupMetadata[];
  "groups.update": Partial<import("./Groups.js").GroupMetadata>[];
  "group-participants.update": {
    id: string;
    participants: string[];
    action: import("./Groups.js").GroupParticipantAction;
  };
  "messaging-history.set": {
    chats: unknown[];
    contacts: import("./Auth.js").Contact[];
    messages: import("./Messages.js").WAMessage[];
    isLatest?: boolean;
  };
  "call": unknown[];
  "labels.edit": unknown;
  "labels.association": unknown;
};

export type BaileysEvent = keyof BaileysEventMap;
