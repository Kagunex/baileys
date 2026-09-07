/**
 * Group metadata & participant types.
 */
export type GroupParticipantAction = "add" | "remove" | "promote" | "demote" | "modify";
export type GroupParticipant = {
    id: string;
    jid?: string;
    admin?: "admin" | "superadmin" | null;
    isAdmin?: boolean;
    isSuperAdmin?: boolean;
    [key: string]: unknown;
};
export type GroupMetadata = {
    id: string;
    subject: string;
    subjectOwner?: string;
    subjectTime?: number;
    creation?: number;
    owner?: string;
    desc?: string;
    descOwner?: string;
    descId?: string;
    restrict?: boolean;
    announce?: boolean;
    size?: number;
    participants: GroupParticipant[];
    ephemeralDuration?: number;
    inviteCode?: string;
    [key: string]: unknown;
};
export type GroupParticipantUpdateResult = {
    status: string;
    jid: string;
    content?: unknown;
};
export type GroupModificationResponse = {
    status: string;
    jid?: string;
    content?: unknown;
    participants?: Array<{
        jid?: string;
        id?: string;
        status?: string;
        [key: string]: unknown;
    }>;
    [key: string]: unknown;
};
//# sourceMappingURL=Groups.d.ts.map