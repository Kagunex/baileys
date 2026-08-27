/**
 * Pairing-code helpers.
 *
 * requestPairingCode on the socket still throws NotImplementedError until the
 * authenticated IQ flow exists.
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
