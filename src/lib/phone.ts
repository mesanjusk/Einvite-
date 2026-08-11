const DEFAULT_COUNTRY_CODE = "91"; // India — matches the rest of the guest flow's target market

/**
 * Normalizes a user-entered mobile number to E.164 (e.g. "+919876543210").
 * Accepts local 10-digit Indian numbers (assumes +91), or numbers already
 * carrying a country code (with or without a leading "+"/"00"). Returns
 * null when the input can't be confidently normalized.
 */
export function normalizePhone(input: string): string | null {
  const digitsOnly = input.trim().replace(/[^\d+]/g, "");
  if (!digitsOnly) return null;

  let national = digitsOnly;
  if (national.startsWith("+")) {
    national = national.slice(1);
  } else if (national.startsWith("00")) {
    national = national.slice(2);
  } else if (national.length === 10) {
    national = `${DEFAULT_COUNTRY_CODE}${national}`;
  }

  if (!/^[1-9]\d{7,14}$/.test(national)) return null;

  return `+${national}`;
}

/** Masks all but the last 2 digits, e.g. "+919876543210" -> "+91••••••••10". */
export function maskPhone(phone: string): string {
  const visible = phone.slice(-2);
  const hidden = phone.slice(0, -2).replace(/\d/g, "•");
  return `${hidden}${visible}`;
}
