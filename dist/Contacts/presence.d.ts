import type { NoiseSession } from "../Noise/session.js";
export type PresenceNet = {
    session: NoiseSession;
    sendFrame: (frame: Buffer) => void;
};
export declare function presenceSubscribe(jid: string, net?: PresenceNet): Promise<void>;
export declare function sendPresenceUpdate(type: "available" | "unavailable", net?: PresenceNet): Promise<void>;
//# sourceMappingURL=presence.d.ts.map