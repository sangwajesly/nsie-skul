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

export interface OfflineTimetableSlot {
  id: string;
  dayOfWeek: number;
  periodNumber: number;
  startTime: string;
  endTime: string;
  isBreak?: boolean;
  periodName?: string;
  subjectName: string;
  subjectCode: string;
  className: string;
  classStreamId: string;
  roomName?: string | null;
  teacherId?: string | null;
  teacherName?: string | null;
}

export interface OfflineTeachingScope {
  academicYearId: string;
  academicYearName: string;
  sequences: { id: string; name: string; termId: string; termName: string }[];
  classes: { id: string; name: string; streams: { id: string; name: string }[] }[];
  subjects: { id: string; name: string; code: string; defaultCoefficient: number; defaultMaxMarks?: number }[];
  assignedStreams: { classStreamId: string; subjectId: string }[];
  enrolledStudents: {
    classStreamId: string;
    studentId: string;
    matricule: string;
    fullName: string;
    gender: string;
  }[];
  timetable?: OfflineTimetableSlot[];
}

export interface OfflineSchoolMembership {
  membershipId: string;
  school: {
    id: string;
    name: string;
    code?: string | null;
    slug?: string | null;
    logo_url?: string | null;
  };
  role: {
    name: string;
    code: string;
  };
}

const VAULT_KEY_PROFILE = "nsei_offline_profile";
const VAULT_KEY_SCOPE = "nsei_offline_scope";
const VAULT_KEY_SCHOOLS = "nsei_offline_schools";
const VAULT_KEY_SCOPE_PREFIX = "nsei_offline_scope_";
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
 * Set or update the offline PIN (supports 4 to 12 characters/digits)
 */
export async function setOfflinePin(pin: string): Promise<{ success: boolean; error?: string }> {
  if (typeof window === "undefined") return { success: false, error: "Window unavailable" };
  const cleanPin = pin.trim();
  if (cleanPin.length < 4 || cleanPin.length > 12) {
    return { success: false, error: "PIN must be between 4 and 12 characters." };
  }

  const salt = crypto.randomUUID();
  const hash = await hashPin(cleanPin, salt);

  localStorage.setItem(VAULT_KEY_PIN_SALT, salt);
  localStorage.setItem(VAULT_KEY_PIN_HASH, hash);
  return { success: true };
}

/**
 * Automatically cache teacher credentials upon successful cloud login
 * so the exact same PIN/code works offline without separate configuration.
 */
export async function saveOfflineTeacherCredentials(identifier: string, pin: string): Promise<void> {
  if (typeof window === "undefined") return;
  const cleanPin = pin.trim();
  if (cleanPin.length >= 4) {
    await setOfflinePin(cleanPin);
    localStorage.setItem("nsei_offline_identifier", identifier.trim());
  }
}

/**
 * Retrieve cached offline identifier (phone or staff code)
 */
export function getOfflineIdentifier(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("nsei_offline_identifier");
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
 * Cache list of all user school memberships for offline switching
 */
export function saveOfflineSchools(schools: OfflineSchoolMembership[]): void {
  if (typeof window === "undefined" || !Array.isArray(schools)) return;
  try {
    localStorage.setItem(VAULT_KEY_SCHOOLS, JSON.stringify(schools));
  } catch (err) {
    console.warn("[OfflineAuth] Could not cache school list:", err);
  }
}

/**
 * Retrieve cached school memberships for offline switcher
 */
export function getOfflineSchools(): OfflineSchoolMembership[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(VAULT_KEY_SCHOOLS);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as OfflineSchoolMembership[];
  } catch {
    return [];
  }
}

/**
 * Cache teaching workspace (classes, subjects, student rosters) into local storage
 * Supports per-school caching so teachers can switch between schools offline.
 */
export function saveOfflineTeachingScope(scope: OfflineTeachingScope, schoolId?: string): void {
  if (typeof window === "undefined") return;
  try {
    const serialized = JSON.stringify(scope);
    localStorage.setItem(VAULT_KEY_SCOPE, serialized);
    if (schoolId) {
      localStorage.setItem(`${VAULT_KEY_SCOPE_PREFIX}${schoolId}`, serialized);
    } else {
      const profile = getOfflineSession();
      if (profile?.schoolId) {
        localStorage.setItem(`${VAULT_KEY_SCOPE_PREFIX}${profile.schoolId}`, serialized);
      }
    }
  } catch (err) {
    console.warn("[OfflineAuth] Could not cache teaching scope:", err);
  }
}

/**
 * Retrieve cached teaching workspace for offline marks entry
 */
export function getOfflineTeachingScope(schoolId?: string): OfflineTeachingScope | null {
  if (typeof window === "undefined") return null;
  const key = schoolId ? `${VAULT_KEY_SCOPE_PREFIX}${schoolId}` : VAULT_KEY_SCOPE;
  const raw = localStorage.getItem(key) || (schoolId ? localStorage.getItem(VAULT_KEY_SCOPE) : null);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as OfflineTeachingScope;
  } catch {
    return null;
  }
}

/**
 * Switch the active school in offline mode without requiring cloud re-auth.
 * Updates local profile and loads corresponding teaching scope.
 */
export function switchOfflineSchool(targetSchoolId: string): boolean {
  if (typeof window === "undefined") return false;

  const schools = getOfflineSchools();
  const target = schools.find((s) => s.school.id === targetSchoolId);
  if (!target) return false;

  const currentProfile = getOfflineSession();
  if (currentProfile) {
    const updatedProfile: OfflineUserProfile = {
      ...currentProfile,
      schoolId: target.school.id,
      schoolName: target.school.name,
      roleCode: target.role.code,
      roleName: target.role.name,
    };
    localStorage.setItem(VAULT_KEY_PROFILE, JSON.stringify(updatedProfile));
  }

  // Swap active scope if a school-specific scope was cached
  const schoolScope = localStorage.getItem(`${VAULT_KEY_SCOPE_PREFIX}${targetSchoolId}`);
  if (schoolScope) {
    localStorage.setItem(VAULT_KEY_SCOPE, schoolScope);
  }

  // Update cookie so browser requests / service worker align
  document.cookie = `nsei_active_school_id=${targetSchoolId}; path=/; max-age=31536000; SameSite=Lax`;

  window.dispatchEvent(
    new CustomEvent("nsei:offline-school-changed", {
      detail: { schoolId: targetSchoolId, schoolName: target.school.name },
    })
  );

  return true;
}

/**
 * Clear offline vault when teacher explicitly signs out
 */
export function clearOfflineVault(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(VAULT_KEY_PROFILE);
  localStorage.removeItem(VAULT_KEY_SCOPE);
  localStorage.removeItem(VAULT_KEY_SCHOOLS);
  localStorage.removeItem(VAULT_KEY_PIN_HASH);
  localStorage.removeItem(VAULT_KEY_PIN_SALT);
  localStorage.removeItem("nsei_offline_unlocked");

  // Clean any school-scoped caches
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(VAULT_KEY_SCOPE_PREFIX)) {
      localStorage.removeItem(k);
    }
  }
}

/**
 * Check if the current tab/device has verified the offline PIN in this session
 */
export function isOfflineUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem("nsei_offline_unlocked") === "true";
}

/**
 * Set the offline session unlock state
 */
export function setOfflineUnlocked(unlocked: boolean): void {
  if (typeof window === "undefined") return;
  if (unlocked) {
    sessionStorage.setItem("nsei_offline_unlocked", "true");
  } else {
    sessionStorage.removeItem("nsei_offline_unlocked");
  }
}

/**
 * Get comprehensive offline vault status for UI banners and settings
 */
export function getOfflineVaultStatus() {
  if (typeof window === "undefined") {
    return {
      hasVault: false,
      hasPin: false,
      isUnlocked: false,
      profile: null,
      daysRemaining: 0,
      studentCount: 0,
      classCount: 0,
      subjectCount: 0,
      lastOnlineAt: null,
    };
  }

  const profile = getOfflineSession();
  const scope = getOfflineTeachingScope();
  const hasPin = hasOfflinePin();
  const isUnlocked = isOfflineUnlocked();

  const daysRemaining = profile?.leaseExpiresAt
    ? Math.max(0, Math.ceil((profile.leaseExpiresAt - Date.now()) / (24 * 60 * 60 * 1000)))
    : 0;

  return {
    hasVault: Boolean(profile),
    hasPin,
    isUnlocked,
    profile,
    daysRemaining,
    studentCount: scope?.enrolledStudents?.length || 0,
    classCount: scope?.classes?.length || 0,
    subjectCount: scope?.subjects?.length || 0,
    lastOnlineAt: profile?.lastOnlineAt || null,
  };
}
