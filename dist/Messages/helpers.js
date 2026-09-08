export function getMessageType(msg) {
    const m = msg.message;
    if (!m)
        return undefined;
    if (m.conversation)
        return "conversation";
    if (m.extendedTextMessage)
        return "extendedTextMessage";
    if (m.imageMessage)
        return "imageMessage";
    if (m.videoMessage)
        return "videoMessage";
    if (m.audioMessage)
        return "audioMessage";
    if (m.documentMessage)
        return "documentMessage";
    if (m.stickerMessage)
        return "stickerMessage";
    if (m.reactionMessage)
        return "reactionMessage";
    if (m.contactMessage)
        return "contactMessage";
    if (m.locationMessage)
        return "locationMessage";
    return Object.keys(m)[0];
}
export function extractMessageText(msg) {
    const m = msg.message;
    if (!m)
        return undefined;
    return (m.conversation ||
        m.extendedTextMessage?.text ||
        m.imageMessage?.caption ||
        m.videoMessage?.caption ||
        m.documentMessage?.caption ||
        m.reactionMessage?.text);
}
//# sourceMappingURL=helpers.js.map