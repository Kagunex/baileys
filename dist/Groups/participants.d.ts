import type { GroupModificationResponse, GroupParticipantAction } from "../Types/Groups.js";
import type { GroupNet } from "./net.js";
export declare function groupParticipantsUpdate(jid: string, participants: string[], action: GroupParticipantAction, net?: GroupNet): Promise<GroupModificationResponse>;
//# sourceMappingURL=participants.d.ts.map