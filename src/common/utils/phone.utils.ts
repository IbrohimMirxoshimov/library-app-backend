/**
 * Normalizes a phone number to 9 digits (without +998 prefix).
 * Handles inputs like: +998901234567, 998901234567, 901234567
 * Returns null if the input is not a valid Uzbek phone number.
 */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // 12 digits: +998XXXXXXXXX → remove prefix
  if (digits.length === 12 && digits.startsWith('998')) {
    return digits.slice(3);
  }

  // 9 digits: already normalized
  if (digits.length === 9) {
    return digits;
  }

  return null;
}

/**
 * Formats a 9-digit phone number for display.
 * Input: 901234567 → Output: +998 90 123 45 67
 */
export function formatPhone(phone: string): string {
  if (phone.length !== 9) return phone;
  return `+998 ${phone.slice(0, 2)} ${phone.slice(2, 5)} ${phone.slice(5, 7)} ${phone.slice(7)}`;
}
