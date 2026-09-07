/**
 * Client-safe pure utilities for phone formatting and normalizations.
 * No server dependencies or database imports.
 */

/**
 * Normalizes a phone string down to 10 digits (US standard)
 * Handles (747) 245-0035, +1-747-245-0035, 7472450035 -> 7472450035
 */
export function normalizePhone(raw?: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1);
  }
  if (digits.length >= 10) {
    return digits.slice(-10);
  }
  return digits.length > 0 ? digits : null;
}

/**
 * Formats a 10-digit phone number as (XXX) XXX-XXXX for clean display
 */
export function formatPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone;
}
