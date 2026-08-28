/**
 * Pairing-code helpers (phone normalization + display formatting).
 *
 * requestPairingCode is implemented on the socket via the companion-linking IQ
 * (link_code_companion_reg / md namespace). WhatsApp itself shows the native
 * Linked Devices notification when should_show_push_notification is set.
 */

export function normalizePairingPhone(phoneNumber: string): string {
  const digits = phoneNumber.replace(/[^\d]/g, "");
  if (digits.length < 8 || digits.length > 15) {
    throw new Error(`Invalid phone number for pairing: ${phoneNumber}`);
  }
  return digits;
}

export function formatPairingCode(code: string): string {
  const clean = code.replace(/\s+/g, "").toUpperCase();
  if (clean.length === 8) {
    return `${clean.slice(0, 4)}-${clean.slice(4)}`;
  }
  return clean;
}
