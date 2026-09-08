import { NotImplementedError } from "../Errors/errors.js";
import { buildGroupCreateIq } from "../Protocol/iq.js";
import { parseGroupCreateResult } from "./parse.js";
import { sealSend } from "./net.js";
export async function groupCreate(subject, participants, net) {
    if (!net)
        throw new NotImplementedError("groupCreate (requires authenticated session)");
    const { id, encoded } = buildGroupCreateIq(subject, participants);
    const result = await net.iq.query(encoded, id, {
        session: net.session,
        send: (pt) => sealSend(net, pt),
    }, net.timeoutMs);
    const meta = parseGroupCreateResult(result);
    if (!meta)
        throw new Error("groupCreate: could not parse metadata from IQ result");
    return meta;
}
//# sourceMappingURL=create.js.map