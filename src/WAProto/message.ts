/**
 * Encode/decode kagunex.wa.Message (subset) using public field numbers.
 */

import type { WAMessageContent, WAMessageKey } from "../Types/Messages.js";
import {
  encodeString,
  encodeBytes,
  encodeBool,
  encodeInt32,
  encodeMessage,
  readFields,
  fieldString,
  fieldBytes,
  fieldBool,
  fieldInt,
  fieldMessage,
} from "./protobuf.js";

export function encodeWaMessageContent(content: WAMessageContent): Buffer {
  const parts: Buffer[] = [];

  if (content.conversation != null) {
    parts.push(encodeString(1, content.conversation));
  }
  if (content.extendedTextMessage) {
    const et = content.extendedTextMessage;
    const inner: Buffer[] = [];
    if (et.text) inner.push(encodeString(1, et.text));
    if (et.contextInfo) {
      const ctxParts: Buffer[] = [];
      const ctx = et.contextInfo;
      if (ctx.stanzaId) ctxParts.push(encodeString(1, ctx.stanzaId));
      if (ctx.participant) ctxParts.push(encodeString(2, ctx.participant));
      if (ctx.mentionedJid) {
        for (const jid of ctx.mentionedJid) ctxParts.push(encodeString(15, jid));
      }
      if (ctx.quotedMessage) {
        ctxParts.push(encodeMessage(3, encodeWaMessageContent(ctx.quotedMessage)));
      }
      inner.push(encodeMessage(17, Buffer.concat(ctxParts)));
    }
    parts.push(encodeMessage(7, Buffer.concat(inner)));
  }
  if (content.imageMessage) {
    const im = content.imageMessage;
    const inner: Buffer[] = [];
    if (im.caption) inner.push(encodeString(1, im.caption));
    if (im.mimetype) inner.push(encodeString(2, im.mimetype));
    if (im.url) inner.push(encodeString(3, im.url));
    if (im.mediaKey) inner.push(encodeBytes(8, Buffer.from(im.mediaKey)));
    parts.push(encodeMessage(3, Buffer.concat(inner)));
  }
  if (content.reactionMessage) {
    const rm = content.reactionMessage;
    const inner: Buffer[] = [];
    if (rm.key) inner.push(encodeMessage(1, encodeMessageKey(rm.key)));
    if (rm.text) inner.push(encodeString(2, rm.text));
    parts.push(encodeMessage(46, Buffer.concat(inner)));
  }
  if (content.protocolMessage) {
    const pm = content.protocolMessage;
    const inner: Buffer[] = [];
    if (pm.key) inner.push(encodeMessage(1, encodeMessageKey(pm.key)));
    if (pm.type != null) inner.push(encodeInt32(2, pm.type));
    parts.push(encodeMessage(12, Buffer.concat(inner)));
  }

  return Buffer.concat(parts);
}

function encodeMessageKey(key: WAMessageKey): Buffer {
  const parts: Buffer[] = [];
  if (key.remoteJid) parts.push(encodeString(1, key.remoteJid));
  if (key.fromMe != null) parts.push(encodeBool(2, !!key.fromMe));
  if (key.id) parts.push(encodeString(3, key.id));
  if (key.participant) parts.push(encodeString(4, key.participant));
  return Buffer.concat(parts);
}

export function decodeWaMessageContent(buf: Buffer): WAMessageContent {
  const fields = readFields(buf);
  const out: WAMessageContent = {};

  const conversation = fieldString(fields, 1);
  if (conversation != null) out.conversation = conversation;

  const extBuf = fieldMessage(fields, 7);
  if (extBuf) {
    const ef = readFields(extBuf);
    out.extendedTextMessage = {
      text: fieldString(ef, 1),
    };
    const ctxBuf = fieldMessage(ef, 17);
    if (ctxBuf) {
      const cf = readFields(ctxBuf);
      out.extendedTextMessage.contextInfo = {
        stanzaId: fieldString(cf, 1),
        participant: fieldString(cf, 2),
        mentionedJid: cf
          .filter((x) => x.fieldNumber === 15 && Buffer.isBuffer(x.value))
          .map((x) => (x.value as Buffer).toString("utf-8")),
      };
      const quoted = fieldMessage(cf, 3);
      if (quoted) {
        out.extendedTextMessage.contextInfo.quotedMessage = decodeWaMessageContent(quoted);
      }
    }
  }

  const imgBuf = fieldMessage(fields, 3);
  if (imgBuf) {
    const imf = readFields(imgBuf);
    out.imageMessage = {
      caption: fieldString(imf, 1),
      mimetype: fieldString(imf, 2),
      url: fieldString(imf, 3),
      mediaKey: fieldBytes(imf, 8) ? new Uint8Array(fieldBytes(imf, 8)!) : undefined,
    };
  }

  const rxBuf = fieldMessage(fields, 46);
  if (rxBuf) {
    const rf = readFields(rxBuf);
    const keyBuf = fieldMessage(rf, 1);
    out.reactionMessage = {
      text: fieldString(rf, 2),
      key: keyBuf ? decodeMessageKey(keyBuf) : undefined,
    };
  }

  const protoBuf = fieldMessage(fields, 12);
  if (protoBuf) {
    const pf = readFields(protoBuf);
    const keyBuf = fieldMessage(pf, 1);
    out.protocolMessage = {
      type: fieldInt(pf, 2),
      key: keyBuf ? decodeMessageKey(keyBuf) : undefined,
    };
  }

  return out;
}

function decodeMessageKey(buf: Buffer): WAMessageKey {
  const f = readFields(buf);
  return {
    remoteJid: fieldString(f, 1),
    fromMe: fieldBool(f, 2),
    id: fieldString(f, 3),
    participant: fieldString(f, 4),
  };
}
