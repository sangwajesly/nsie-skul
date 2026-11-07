/**
 * PIN normalization and authentication helper utilities for Nsei Sukul.
 *
 * Supabase GoTrue Auth enforces a minimum password length of 6 characters.
 * In Cameroon, teachers and administrators commonly use 4-digit to 6-digit PINs
 * (like Mobile Money PINs).
 *
 * For PINs shorter than 6 characters (e.g., 4 or 5 digits), we deterministically
 * pad them with an internal salt suffix for Supabase Auth, completely invisible
 * to the end-user.
 */

export function normalizePinForAuth(pin: string): string {
  const clean = (pin || "").trim();
  if (clean.length >= 6) {
    return clean;
  }
  return `${clean}#nsei`;
}

/**
 * Returns candidate password variants to try when authenticating with a teacher PIN.
 * Handles:
 * 1. Normalized PIN (for 4 or 5 digit PINs, e.g. "1234#nsei")
 * 2. Raw PIN (for 6+ digit PINs or if stored raw)
 * 3. Legacy padEnd(6, "0") padding (e.g. "123400") in case an account was previously created with it
 */
export function getPinAuthCandidates(pin: string): string[] {
  const clean = (pin || "").trim();
  const candidates: string[] = [];

  if (clean.length < 6) {
    candidates.push(normalizePinForAuth(clean));
    candidates.push(clean.padEnd(6, "0"));
  } else {
    candidates.push(clean);
  }

  candidates.push(clean);

  // Return unique candidates preserving insertion order
  return Array.from(new Set(candidates));
}
