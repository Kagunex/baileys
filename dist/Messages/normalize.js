export function normalizeMessage(msg) {
    return {
        ...msg,
        key: {
            ...msg.key,
            fromMe: !!msg.key.fromMe,
            id: msg.key.id ?? "",
            remoteJid: msg.key.remoteJid ?? "",
        },
        messageTimestamp: typeof msg.messageTimestamp === "number"
            ? msg.messageTimestamp
            : Math.floor(Date.now() / 1000),
    };
}
//# sourceMappingURL=normalize.js.map