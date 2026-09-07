import type { GroupNet } from "./net.js";
export declare function groupUpdateSubject(jid: string, subject: string, net?: GroupNet): Promise<void>;
export declare function groupUpdateDescription(jid: string, description?: string, net?: GroupNet): Promise<void>;
export declare function groupInviteCode(jid: string, net?: GroupNet): Promise<string>;
export declare function groupRevokeInvite(jid: string, net?: GroupNet): Promise<string>;
export declare function groupLeave(jid: string, net?: GroupNet): Promise<void>;
//# sourceMappingURL=settings.d.ts.map