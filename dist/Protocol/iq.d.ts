import type { BinaryNode } from "../WABinary/types.js";
export declare function buildIq(opts: {
    to?: string;
    type: "get" | "set";
    xmlns: string;
    content?: BinaryNode | BinaryNode[];
    id?: string;
}): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildGroupCreateIq(subject: string, participants: string[]): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildGroupMetadataIq(jid: string): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildGroupParticipantsIq(jid: string, participants: string[], action: "add" | "remove" | "promote" | "demote"): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildGroupSubjectIq(jid: string, subject: string): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildGroupDescriptionIq(jid: string, description?: string): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildGroupInviteCodeIq(jid: string): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildGroupRevokeInviteIq(jid: string): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildGroupLeaveIq(jid: string): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
export declare function buildPresenceIq(type: "available" | "unavailable"): {
    node: BinaryNode;
    encoded: Buffer<ArrayBufferLike>;
};
export declare function buildPresenceSubscribe(jid: string): {
    encoded: Buffer<ArrayBufferLike>;
};
export declare function buildOnWhatsAppIq(jids: string[]): {
    id: string;
    node: BinaryNode;
    encoded: Buffer;
};
//# sourceMappingURL=iq.d.ts.map