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
import type { BrowserDescription } from "../Types/Socket.js";
export type ClientPayloadOptions = {
    version?: [number, number, number];
    browser?: BrowserDescription;
    /** Phone number without @s.whatsapp.net suffix — registered sessions only */
    username?: string;
    /** When true, session resume (no QR/pairing). Default: !username */
    passive?: boolean;
    connectType?: number;
    connectReason?: number;
};
/**
 * Encode ClientPayload as protobuf binary.
 *
 * Replaces the previous WABinary (binary XML) encoding which was incompatible
 * with the WhatsApp server's expected protobuf format after the Noise handshake.
 */
export declare function encodeClientPayload(options?: ClientPayloadOptions): Buffer;
//# sourceMappingURL=client-payload.d.ts.map