import { NotImplementedError } from "../Errors/errors.js";
import { buildGroupParticipantsIq } from "../Protocol/iq.js";
import { parseGroupModification } from "./parse.js";
import { sealSend } from "./net.js";
export async function groupParticipantsUpdate(jid, participants, action, net) {
    if (!net) {
        throw new NotImplementedError("groupParticipantsUpdate (requires authenticated IQ)");
    }
    const { id, encoded } = buildGroupParticipantsIq(jid, participants, action);
    const result = await net.iq.query(encoded, id, {
        session: net.session,
        send: (pt) => sealSend(net, pt),
    }, net.timeoutMs);
    return parseGroupModification(result);
}
//# sourceMappingURL=participants.js.map