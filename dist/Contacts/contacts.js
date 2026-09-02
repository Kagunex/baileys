import { NotImplementedError } from "../Errors/errors.js";
import { buildOnWhatsAppIq } from "../Protocol/iq.js";
import { getBinaryNodeAttr, getBinaryNodeChild, getBinaryNodeChildren, } from "../WABinary/index.js";
export async function onWhatsApp(jids, net) {
    if (!net)
        throw new NotImplementedError("onWhatsApp (requires authenticated query)");
    const { id, encoded } = buildOnWhatsAppIq(jids);
    const result = await net.iq.query(encoded, id, {
        session: net.session,
        send: (pt) => net.sendFrame(net.session.seal(pt)),
    });
    // Best-effort parse usync list
    const out = [];
    try {
        const list = getBinaryNodeChild(result, "list") ||
            getBinaryNodeChild(getBinaryNodeChild(result, "usync") || result, "list");
        const users = list ? getBinaryNodeChildren(list, "user") : getBinaryNodeChildren(result, "user");
        for (const u of users) {
            const jid = getBinaryNodeAttr(u, "jid");
            if (!jid)
                continue;
            const contact = getBinaryNodeChild(u, "contact");
            const type = contact ? getBinaryNodeAttr(contact, "type") : undefined;
            out.push({ jid, exists: type !== "out" && type !== "invalid" });
        }
    }
    catch {
        /* empty */
    }
    if (!out.length) {
        // fallback: unknown existence
        return jids.map((jid) => ({ jid, exists: false }));
    }
    return out;
}
export async function fetchStatus(_jid) {
    throw new NotImplementedError("fetchStatus");
}
//# sourceMappingURL=contacts.js.map