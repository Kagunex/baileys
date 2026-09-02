/**
 * Pairing-code helpers (phone normalization + display formatting).
 *
 * requestPairingCode is implemented on the socket via the companion-linking IQ
 * (link_code_companion_reg / md namespace). WhatsApp itself shows the native
 * Linked Devices notification when should_show_push_notification is set.
 */
export declare function normalizePairingPhone(phoneNumber: string): string;
export declare function formatPairingCode(code: string): string;
//# sourceMappingURL=pairing.d.ts.map