/**
 * Pairing-code helpers (phone normalization + display formatting).
 *
 * requestPairingCode is implemented on the socket via the companion-linking IQ
 * (link_code_companion_reg / md namespace). WhatsApp itself shows the native
 * Linked Devices notification when should_show_push_notification is set.
 */
export function normalizePairingPhone(phoneNumber) {
    // Strip non-digits, then convert common local Indonesian form 08xx… → 628xx…
    let digits = phoneNumber.replace(/[^\d]/g, "");
    if (digits.startsWith("0") && digits.length >= 10 && digits.length <= 13) {
        digits = "62" + digits.slice(1);
    }
    if (digits.length < 8 || digits.length > 15) {
        throw new Error(`Invalid phone number for pairing: ${phoneNumber}`);
    }
    return digits;
}
export function formatPairingCode(code) {
    const clean = code.replace(/\s+/g, "").toUpperCase();
    if (clean.length === 8) {
        return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return clean;
}
//# sourceMappingURL=pairing.js.map