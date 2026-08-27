
import type { AuthenticationCreds } from "./Auth.js";
import type { WAMessage, WAMessageKey } from "./Messages.js";
import type { GroupMetadata } from "./Groups.js";
import type { Contact } from "./Contacts.js";

export type ConnectionState = "connecting" | "open" | "close";
export type DisconnectReason = { code?: number; message?: string; statusCode?: number; isLoggedOut?: boolean };
export type ConnectionUpdate = {
  connection?: ConnectionState; lastDisconnect?: { error?: Error | DisconnectReason; date?: Date };
  qr?: string; isNewLogin?: boolean; receivedPendingNotifications?: boolean; isOnline?: boolean;
};
export type MessagesUpsert = { messages: WAMessage[]; type: "notify" | "append"; requestId?: string };
export type MessagesUpdate = { key: WAMessageKey; update: Partial<WAMessage> };
export type MessagesDelete = { keys: WAMessageKey[]; all?: boolean };
export type MessageReaction = { key: WAMessageKey; reaction: { text?: string; key?: WAMessageKey } };
export type GroupUpdate = Partial<GroupMetadata> & { id: string };
export type ContactUpdate = Partial<Contact> & { id: string };
export type PresenceUpdate = { id: string; presences: { [p: string]: { lastKnownPresence?: string; lastSeen?: number } } };

export interface BaileysEventMap {
  "connection.update": ConnectionUpdate;
  "creds.update": Partial<AuthenticationCreds>;
  "messages.upsert": MessagesUpsert;
  "messages.update": MessagesUpdate[];
  "messages.delete": MessagesDelete;
  "messages.reaction": MessageReaction[];
  "groups.update": GroupUpdate[];
  "group-participants.update": { id: string; participants: string[]; action: "add" | "remove" | "promote" | "demote" };
  "contacts.update": ContactUpdate[];
  "contacts.upsert": Contact[];
  "presence.update": PresenceUpdate;
  "call": unknown[];
  "messaging-history.set": { chats: unknown[]; contacts: Contact[]; messages: WAMessage[]; isLatest?: boolean };
}
export type BaileysEvent = keyof BaileysEventMap;
