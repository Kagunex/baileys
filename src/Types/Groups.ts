
export type GroupParticipant = { id: string; admin?: "admin" | "superadmin" | null };
export type GroupMetadata = {
  id: string; subject: string; subjectOwner?: string; subjectTime?: number; creation?: number; owner?: string;
  desc?: string; descOwner?: string; descId?: string; restrict?: boolean; announce?: boolean;
  participants: GroupParticipant[]; ephemeralDuration?: number; size?: number;
};
export type GroupParticipantAction = "add" | "remove" | "promote" | "demote";
export type GroupModificationResponse = { status: string; jid?: string; participants?: Array<{ jid: string; status: string }> };
