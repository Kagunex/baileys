export function sealSend(net, plaintext) {
    net.sendFrame(net.session.seal(plaintext));
}
//# sourceMappingURL=net.js.map