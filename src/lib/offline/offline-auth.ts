/**
 * Offline Authentication & PIN Vault
 * Enables teachers to access and unlock their cached teaching workspace
 * when completely offline (zero mobile data / no school internet).
 * 
 * Security: Uses native Web Crypto API (SHA-256 with unique device salt).
 */

export interface OfflineUserProfile {
  userId: string;
  fullName: string;
  email: string;
  roleCode: string;
  roleName: string;
  schoolId: string;
  schoolName: string;
  lastOnlineAt: number;
  leaseExpiresAt: number; // 30 days offline lease
}

export interface OfflineTeachingScope {
  academicYearId: string;
  academicYearName: string;
  sequences: { id: string; name: string; termId: string; termName: string }[];
  classes: { id: string; name: string; streams: { id: string; name: string }[] }[];
  subjects: { id: string; name: string; code: string; defaultCoefficient: number }[];
  assignedStreams: { classStreamId: string; subjectId: string }[];
  enrolledStudents: {
    classStreamId: string;
    studentId: string;
    matricule: string;
    fullName: string;
    gender: string;
  }[];
}

const VAULT_KEY_PROFILE = "nsei_offline_profile";
const VAULT_KEY_SCOPE = "nsei_offline_scope";
const VAULT_KEY_PIN_HASH = "nsei_offline_pin_hash";
const VAULT_KEY_PIN_SALT = "nsei_offline_pin_salt";
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Hash a 4-digit PIN with a device-specific salt using native Web Crypto
 */
async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin.trim()}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Check if the current device has an active offline vault setup
 */
export function hasOfflineVault(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(VAULT_KEY_PROFILE));
}

/**
 * Check if the teacher has configured a 4-digit offline PIN
 */
export function hasOfflinePin(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(localStorage.getItem(VAULT_KEY_PIN_HASH));
}

/**
 * Set or update the 4-digit offline PIN
 */
export async function setOfflinePin(pin: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Window unavailable" };
  const cleanPin = pin.trim();
  if (!/^\d{4}$/.test(cleanPin)) {
    return { success: false, error: "PIN must be exactly 4 numeric digits." };
  }

  const salt = crypto.randomUUID();
  const hash = await hashPin(cleanPin, salt);

  localStorage.setItem(VAULT_KEY_PIN_SALT, salt);
  localStorage.setItem(VAULT_KEY_PIN_HASH, hash);
  return { success: true };
}

/**
 * Verify the 4-digit offline PIN to unlock the cached workspace
 */
export async function verifyOfflinePin(pin: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const storedHash = localStorage.getItem(VAULT_KEY_PIN_HASH);
  const storedSalt = localStorage.getItem(VAULT_KEY_PIN_SALT);

  if (!storedHash || !storedSalt) return false;

  const computedHash = await hashPin(pin.trim(), storedSalt);
  return computedHash === storedHash;
}

/**
 * Cache current authenticated teacher session & school profile for offline use.
 * Called automatically when online in dashboard layout.
 */
export function saveOfflineSession(profile: {
  userId: string;
  fullName: string;
  email: string;
  roleCode: string;
  roleName: string;
  schoolId: string;
  schoolName: string;
}): void {
  if (typeof window === "undefined") return;
  const now = Date.now();
  const offlineProfile: OfflineUserProfile = {
    ...profile,
    lastOnlineAt: now,
    leaseExpiresAt: now + THIRTY_DAYS_MS,
  };
  localStorage.setItem(VAULT_KEY_PROFILE, JSON.stringify(offlineProfile));
}

/**
 * Retrieve the offline user profile
 */
export function getOfflineSession(): OfflineUserProfile | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(VAULT_KEY_PROFILE);
  if (!raw) return null;
  try {
    const profile = JSON.parse(raw) as OfflineUserProfile;
    // Check if offline lease has expired (> 30 days without connecting)
    if (Date.now() > profile.leaseExpiresAt) {
      console.warn("[OfflineAuth] Offline lease expired. Re-authentication required.");
      return null;
    }
    return profile;
  } catch {
    return null;
  }
}

/**
 * Cache teaching workspace (classes, subjects, student rosters) into local storage
 */
export function saveOfflineTeachingScope(scope: OfflineTeachingScope): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(VAULT_KEY_SCOPE, JSON.stringify(scope));
  } catch (err) {
    console.warn("[OfflineAuth] Could not cache teaching scope:", err);
  }
}

/**
 * Retrieve cached teaching workspace for offline marks entry
 */
export function getOfflineTeachingScope(): OfflineTeachingScope | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(VAULT_KEY_SCOPE);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfflineTeachingScope;
  } catch {
    return null;
  }
}

/**
 * Clear offline vault when teacher explicitly signs out
 */
export function clearOfflineVault(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VAULT_KEY_PROFILE);
  localStorage.removeItem(VAULT_KEY_SCOPE);
  localStorage.removeItem(VAULT_KEY_PIN_HASH);
  localStorage.removeItem(VAULT_KEY_PIN_SALT);
}
