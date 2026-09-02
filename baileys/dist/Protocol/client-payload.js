/**
 * Post-Noise client identification payload.
 * Registered sessions send username + passive=false for resume without pairing.
 */
import { DEFAULT_BROWSER, DEFAULT_VERSION } from "../Defaults/index.js";
import { encodeBinaryNode } from "../WABinary/encode.js";
export function buildClientPayloadNode(options = {}) {
    const version = options.version ?? DEFAULT_VERSION;
    const browser = options.browser ?? DEFAULT_BROWSER;
    const hasUser = !!options.username;
    const passive = options.passive ?? !hasUser;
    const userAgent = {
        tag: "userAgent",
        attrs: {},
        content: [
            { tag: "platform", attrs: {}, content: "web" },
            {
                tag: "appVersion",
                attrs: {},
                content: [
                    { tag: "primary", attrs: {}, content: String(version[0]) },
                    { tag: "secondary", attrs: {}, content: String(version[1]) },
                    { tag: "tertiary", attrs: {}, content: String(version[2]) },
                ],
            },
            { tag: "mcc", attrs: {}, content: "000" },
            { tag: "mnc", attrs: {}, content: "000" },
            { tag: "osVersion", attrs: {}, content: browser[2] || "0.1" },
            { tag: "device", attrs: {}, content: browser[1] || "Desktop" },
            { tag: "osBuildNumber", attrs: {}, content: "0.1" },
            { tag: "releaseChannel", attrs: {}, content: "RELEASE" },
            { tag: "localeLanguageIso6391", attrs: {}, content: "en" },
            { tag: "localeCountryIso31661Alpha2", attrs: {}, content: "US" },
        ],
    };
    const webInfo = {
        tag: "webInfo",
        attrs: {},
        content: [{ tag: "webSubPlatform", attrs: {}, content: "WEB_BROWSER" }],
    };
    const children = [
        { tag: "passive", attrs: {}, content: passive ? "true" : "false" },
        userAgent,
        webInfo,
        {
            tag: "connectType",
            attrs: {},
            content: options.connectType ?? (hasUser ? "wifi_unknown" : "wifi_unknown"),
        },
        {
            tag: "connectReason",
            attrs: {},
            content: options.connectReason ?? "user_activated",
        },
    ];
    if (options.username) {
        children.unshift({
            tag: "username",
            attrs: {},
            content: options.username.replace(/@.*/, "") || options.username,
        });
    }
    // Device pairing name for companion
    if (!hasUser) {
        children.push({
            tag: "devicePairingData",
            attrs: {},
            content: [
                {
                    tag: "e_regid",
                    attrs: {},
                    content: Buffer.alloc(4).toString("base64"),
                },
            ],
        });
    }
    return { tag: "clientPayload", attrs: {}, content: children };
}
export function encodeClientPayload(options = {}) {
    return encodeBinaryNode(buildClientPayloadNode(options));
}
//# sourceMappingURL=client-payload.js.map