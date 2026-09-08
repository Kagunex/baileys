/**
 * Post-Noise client identification payload — proper protobuf encoding.
 *
 * WhatsApp expects a protobuf-encoded ClientPayload (NOT WABinary XML) as the
 * first encrypted frame after the Noise XX handshake completes.
 *
 * Field numbers from publicly documented WhatsApp proto (WAProto):
 *
 *   ClientPayload {
 *     username                      = 1  (uint64)
 *     passive                       = 3  (bool)
 *     userAgent                     = 5  (message)
 *     webInfo                       = 6  (message)
 *     pushName                      = 7  (string)
 *     connectType                   = 12 (enum: WIFI_UNKNOWN=1)
 *     connectReason                 = 13 (enum: USER_ACTIVATED=1)
 *     devicePairingRegistrationData = 19 (message, new devices only)
 *   }
 *
 *   ClientPayloadUserAgent {
 *     platform         = 1  (enum: WEB=14)
 *     appVersion       = 2  (message: {primary=1, secondary=2, tertiary=3})
 *     mcc              = 3  (string)
 *     mnc              = 4  (string)
 *     osVersion        = 5  (string)
 *     manufacturer     = 6  (string)
 *     device           = 7  (string)
 *     osBuildNumber    = 8  (string)
 *     releaseChannel   = 10 (enum: RELEASE=0)
 *     localeLanguageIso6391         = 11 (string)
 *     localeCountryIso31661Alpha2   = 12 (string)
 *   }
 *
 *   ClientPayloadWebInfo {
 *     webSubPlatform = 3 (enum: WEB_BROWSER=0)
 *   }
 *
 *   DevicePairingRegistrationData {
 *     eRegid         = 1 (bytes) — 4-byte registration ID
 *     eKeytype       = 2 (bytes) — key type
 *     eIdent         = 3 (bytes) — identity key public
 *     buildHash      = 7 (bytes)
 *     companionProps = 8 (bytes) — CompanionProps protobuf
 *     deviceId       = 9 (bytes)
 *   }
 *
 *   CompanionProps {
 *     os           = 1 (string)
 *     version      = 2 (message: AppVersion)
 *     platformType = 3 (enum: CHROME=3)
 *   }
 */
import { DEFAULT_BROWSER, DEFAULT_VERSION } from "../Defaults/index.js";
import { encodeBytes, encodeVarint, encodeString, encodeVarint64, } from "../WAProto/protobuf.js";
// ── proto enum constants ─────────────────────────────────────────────────────
const PLATFORM_WEB = 14;
const RELEASE_CHANNEL = 0; // RELEASE
const CONNECT_WIFI_UNKNOWN = 1;
const CONNECT_USER_ACTIVATED = 1;
const WEB_BROWSER = 0;
const COMPANION_CHROME = 3;
// ── encode helpers ───────────────────────────────────────────────────────────
function encodeAppVersion(v) {
    return Buffer.concat([
        encodeVarint(1, v[0]),
        encodeVarint(2, v[1]),
        encodeVarint(3, v[2]),
    ]);
}
function encodeUserAgent(version, browser) {
    const [, deviceName, osVersion] = browser;
    return Buffer.concat([
        encodeVarint(1, PLATFORM_WEB), // platform = WEB
        encodeBytes(2, encodeAppVersion(version)), // appVersion
        encodeString(3, "000"), // mcc
        encodeString(4, "000"), // mnc
        encodeString(5, osVersion || "0.1"), // osVersion
        encodeString(7, deviceName || "Desktop"), // device
        encodeString(8, "0.1"), // osBuildNumber
        encodeVarint(10, RELEASE_CHANNEL), // releaseChannel = RELEASE
        encodeString(11, "en"), // localeLanguageIso6391
        encodeString(12, "US"), // localeCountryIso31661Alpha2
    ]);
}
function encodeWebInfo() {
    return encodeVarint(3, WEB_BROWSER); // webSubPlatform = WEB_BROWSER
}
function encodeCompanionProps(version) {
    return Buffer.concat([
        encodeString(1, "Chrome"), // os
        encodeBytes(2, encodeAppVersion(version)), // version
        encodeVarint(3, COMPANION_CHROME), // platformType = CHROME
    ]);
}
function encodeDevicePairingData(version) {
    const eRegid = Buffer.alloc(4); // 4-byte registration ID
    eRegid.writeUInt32BE(Math.floor(Math.random() * 0xffff) & 0xffff_ffff);
    const companionProps = encodeCompanionProps(version);
    return Buffer.concat([
        encodeBytes(1, eRegid), // eRegid
        encodeBytes(8, companionProps), // companionProps
    ]);
}
/**
 * Encode ClientPayload as protobuf binary.
 *
 * Replaces the previous WABinary (binary XML) encoding which was incompatible
 * with the WhatsApp server's expected protobuf format after the Noise handshake.
 */
export function encodeClientPayload(options = {}) {
    const version = options.version ?? DEFAULT_VERSION;
    const browser = options.browser ?? DEFAULT_BROWSER;
    const hasUser = !!options.username;
    const passive = options.passive ?? !hasUser;
    const parts = [];
    // field 1: username (uint64) — only for registered sessions
    if (options.username) {
        const phone = options.username
            .replace(/@.*/, "") // strip @s.whatsapp.net
            .replace(/\D/g, ""); // digits only
        if (phone.length > 0) {
            try {
                parts.push(encodeVarint64(1, BigInt(phone)));
            }
            catch {
                // non-numeric username — skip field 1
            }
        }
    }
    // field 3: passive (bool)
    parts.push(encodeVarint(3, passive ? 1 : 0));
    // field 5: userAgent
    parts.push(encodeBytes(5, encodeUserAgent(version, browser)));
    // field 6: webInfo
    parts.push(encodeBytes(6, encodeWebInfo()));
    // field 12: connectType = WIFI_UNKNOWN
    parts.push(encodeVarint(12, options.connectType ?? CONNECT_WIFI_UNKNOWN));
    // field 13: connectReason = USER_ACTIVATED
    parts.push(encodeVarint(13, options.connectReason ?? CONNECT_USER_ACTIVATED));
    // field 19: devicePairingRegistrationData — only for new (unregistered) devices
    if (!hasUser) {
        parts.push(encodeBytes(19, encodeDevicePairingData(version)));
    }
    return Buffer.concat(parts);
}
//# sourceMappingURL=client-payload.js.map