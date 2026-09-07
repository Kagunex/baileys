import { NotImplementedError } from "../Errors/errors.js";
import { buildPresenceSubscribe, buildPresenceIq } from "../Protocol/iq.js";
export async function presenceSubscribe(jid, net) {
    if (!net)
        throw new NotImplementedError("presenceSubscribe");
    net.sendFrame(net.session.seal(buildPresenceSubscribe(jid).encoded));
}
export async function sendPresenceUpdate(type, net) {
    if (!net)
        throw new NotImplementedError("sendPresenceUpdate");
    net.sendFrame(net.session.seal(buildPresenceIq(type).encoded));
}
//# sourceMappingURL=presence.js.map