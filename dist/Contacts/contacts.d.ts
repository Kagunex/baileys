import type { NoiseSession } from "../Noise/session.js";
import type { IqController } from "../Socket/iq-controller.js";
export type ContactNet = {
    session: NoiseSession;
    sendFrame: (frame: Buffer) => void;
    iq: IqController;
};
export declare function onWhatsApp(jids: string[], net?: ContactNet): Promise<Array<{
    jid: string;
    exists: boolean;
} | undefined>>;
export declare function fetchStatus(_jid: string): Promise<{
    status?: string;
    setAt?: Date;
} | undefined>;
//# sourceMappingURL=contacts.d.ts.map