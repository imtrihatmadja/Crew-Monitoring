/**
 * Helper utility for hashing NIK with SHA-256 and masking digits for UI.
 * Ensures plain-text NIK is never saved or transmitted plain.
 */

export async function hashNik(nik: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(nik.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function maskNik(nik: string): string {
  const clean = nik.replace(/\D/g, '');
  if (clean.length < 4) return '****************';
  const last4 = clean.slice(-4);
  return `****************${last4}`;
}

export function formatMaskedDisplay(last4: string): string {
  return `**** **** **** ${last4}`;
}

export function validateNikFormat(nik: string): { valid: boolean; message?: string } {
  const clean = nik.replace(/\D/g, '');
  if (clean.length !== 16) {
    return { valid: false, message: 'NIK harus terdiri tepat 16 digit angka' };
  }
  return { valid: true };
}
