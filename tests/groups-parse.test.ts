import { describe, it, expect } from "vitest";
import {
  parseGroupMetadata,
  parseInviteCode,
  parseGroupModification,
} from "../src/Groups/parse.js";
import { encodeBinaryNode, decodeBinaryNode } from "../src/WABinary/index.js";
import { buildGroupCreateIq, buildGroupMetadataIq } from "../src/Protocol/iq.js";

describe("Groups parse + IQ", () => {
  it("parses group metadata node", () => {
    const iq = {
      tag: "iq",
      attrs: { type: "result", id: "1" },
      content: [
        {
          tag: "group",
          attrs: {
            id: "120363@g.us",
            subject: "Test Group",
            creation: "1700000000",
            creator: "628@s.whatsapp.net",
          },
          content: [
            { tag: "participant", attrs: { jid: "628@s.whatsapp.net", type: "superadmin" } },
            { tag: "participant", attrs: { jid: "629@s.whatsapp.net" } },
            { tag: "description", attrs: {}, content: "hello desc" },
          ],
        },
      ],
    };
    const meta = parseGroupMetadata(iq as any);
    expect(meta?.subject).toBe("Test Group");
    expect(meta?.participants).toHaveLength(2);
    expect(meta?.participants[0].admin).toBe("superadmin");
    expect(meta?.desc).toBe("hello desc");
  });

  it("parses invite code", () => {
    const node = {
      tag: "iq",
      attrs: { type: "result" },
      content: [{ tag: "invite", attrs: { code: "AbCdEfGh" } }],
    };
    expect(parseInviteCode(node as any)).toBe("AbCdEfGh");
  });

  it("builds create/metadata iq", () => {
    const c = buildGroupCreateIq("Hi", ["1@s.whatsapp.net"]);
    expect(decodeBinaryNode(c.encoded).attrs.xmlns).toBe("w:g2");
    const m = buildGroupMetadataIq("120@g.us");
    expect(decodeBinaryNode(m.encoded).attrs.to).toBe("120@g.us");
  });

  it("parses modification", () => {
    const node = {
      tag: "iq",
      attrs: { type: "result", from: "120@g.us" },
      content: [
        { tag: "participant", attrs: { jid: "1@s.whatsapp.net", code: "200" } },
      ],
    };
    const r = parseGroupModification(node as any);
    expect(r.status).toBe("ok");
    expect(r.participants?.[0].jid).toBe("1@s.whatsapp.net");
  });
});
