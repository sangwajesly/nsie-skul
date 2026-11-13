import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface HubNodeConfig {
  nodeKey: string;
  schoolId: string;
  schoolName: string;
  schoolCode: string;
  schoolSlug?: string;
  schoolLogoUrl?: string | null;
  pinHash?: string | null;
  pinSalt?: string | null;
  cloudSyncUrl?: string;
  lastSyncAt?: string | null;
  activatedAt?: string;
}

export const HUB_SESSION_COOKIE = "nsei_hub_admin_session";
const CONFIG_FILE_NAME = "hub-node-config.json";

/**
 * Returns a guaranteed writable directory for Hub node configuration and persistent local keys.
 */
export function getHubDataDirectory(): string {
  // 1. Try application directory if writable
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
    return process.cwd();
  } catch {}

  // 2. Try Windows ProgramData (accessible machine-wide)
  const programData = process.env.PROGRAMDATA || process.env.ALLUSERSPROFILE;
  if (programData) {
    const dir = path.join(programData, "NseiSukulHub");
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch {}
  }

  // 3. Fallback to LocalAppData
  const localAppData = process.env.LOCALAPPDATA || process.env.APPDATA;
  if (localAppData) {
    const dir = path.join(localAppData, "NseiSukulHub");
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch {}
  }

  return process.cwd();
}

function getConfigFilePath(): string {
  // Check if config exists in primary or secondary location
  const primaryPath = path.join(getHubDataDirectory(), CONFIG_FILE_NAME);
  if (fs.existsSync(primaryPath)) return primaryPath;

  const cwdPath = path.join(process.cwd(), CONFIG_FILE_NAME);
  if (fs.existsSync(cwdPath)) return cwdPath;

  return primaryPath;
}

const DEFAULT_SECRET = "nsei-sukul-local-hub-station-secret-2026";

/**
 * Checks if current server process is configured as an on-premise School Hub.
 */
export function isSchoolHubMode(): boolean {
  return (
    process.env.HUB_MODE === "true" ||
    process.env.NEXT_PUBLIC_HUB_MODE === "true" ||
    Boolean(process.env.HUB_NODE_KEY) ||
    fs.existsSync(getConfigFilePath())
  );
}

/**
 * Loads current local Hub configuration from hub-node-config.json or environment.
 */
export function getHubNodeConfig(): HubNodeConfig | null {
  const filePath = getConfigFilePath();
  if (fs.existsSync(filePath)) {
    try {
      const raw = fs.readFileSync(filePath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.nodeKey && parsed.schoolId) {
        return parsed as HubNodeConfig;
      }
    } catch (e) {
      console.warn("[HubNodeStore] Error reading hub-node-config.json:", e);
    }
  }

  // Also check LocalAppData fallback path if not found in primary
  const fallbackPath = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE || ".", "NseiSukulHub", CONFIG_FILE_NAME);
  if (fs.existsSync(fallbackPath)) {
    try {
      const raw = fs.readFileSync(fallbackPath, "utf8");
      const parsed = JSON.parse(raw);
      if (parsed.nodeKey && parsed.schoolId) {
        return parsed as HubNodeConfig;
      }
    } catch {}
  }

  // Fallback to environment variables if config file not yet created
  const envKey = process.env.HUB_NODE_KEY;
  if (envKey) {
    const config: HubNodeConfig = {
      nodeKey: envKey,
      schoolId: process.env.HUB_SCHOOL_ID || "hub-local-school",
      schoolName: process.env.HUB_SCHOOL_NAME || "Local School Station",
      schoolCode: process.env.HUB_SCHOOL_CODE || "LOCAL",
      schoolSlug: "local-school",
      cloudSyncUrl: process.env.CLOUD_SYNC_URL || "https://nsei-sukul.klarifypath.com/api/v1/hub/sync",
      activatedAt: new Date().toISOString(),
    };
    return config;
  }

  return null;
}

/**
 * Saves or updates local Hub node configuration.
 */
export function saveHubNodeConfig(config: Partial<HubNodeConfig>): HubNodeConfig {
  const existing = getHubNodeConfig() || {
    nodeKey: "",
    schoolId: "",
    schoolName: "",
    schoolCode: "",
  };

  const merged: HubNodeConfig = {
    ...existing,
    ...config,
    activatedAt: existing.activatedAt || new Date().toISOString(),
  };

  const primaryPath = path.join(getHubDataDirectory(), CONFIG_FILE_NAME);
  try {
    fs.writeFileSync(primaryPath, JSON.stringify(merged, null, 2), "utf8");
  } catch (err) {
    console.error("[HubNodeStore] Failed to write to primary path:", err);
    try {
      const fallbackDir = path.join(process.env.LOCALAPPDATA || process.env.USERPROFILE || ".", "NseiSukulHub");
      if (!fs.existsSync(fallbackDir)) fs.mkdirSync(fallbackDir, { recursive: true });
      fs.writeFileSync(path.join(fallbackDir, CONFIG_FILE_NAME), JSON.stringify(merged, null, 2), "utf8");
    } catch (fallbackErr) {
      console.error("[HubNodeStore] Fallback write failed:", fallbackErr);
    }
  }

  return merged;
}

/**
 * Hash a PIN with salt using SHA-256
 */
export function hashHubPin(pin: string, salt: string): string {
  return crypto.createHash("sha256").update(`${salt}:${pin.trim()}`).digest("hex");
}

/**
 * Sets a new 4-6 digit School Hub Master PIN.
 */
export function setHubMasterPin(pin: string): { success: boolean; error?: string } {
  const cleanPin = pin.trim();
  if (cleanPin.length < 4 || cleanPin.length > 8) {
    return { success: false, error: "Master PIN must be between 4 and 8 characters/digits." };
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const pinHash = hashHubPin(cleanPin, salt);

  saveHubNodeConfig({
    pinHash,
    pinSalt: salt,
  });

  return { success: true };
}

/**
 * Verifies a PIN or Node Key against local Hub configuration.
 */
export function verifyHubAccess(input: string): { success: boolean; reason?: string } {
  const cleanInput = input.trim();
  const config = getHubNodeConfig();

  if (!config || !config.nodeKey) {
    return { success: false, reason: "School Hub is not configured with a Node Key." };
  }

  // 1. Direct match with Node Key (Master recovery fallback)
  if (cleanInput.toLowerCase() === config.nodeKey.toLowerCase()) {
    return { success: true };
  }

  // 2. If no PIN is configured yet, accept any 4+ digit PIN on first run and save it
  if (!config.pinHash || !config.pinSalt) {
    setHubMasterPin(cleanInput);
    return { success: true };
  }

  // 3. Verify against hashed PIN
  const computed = hashHubPin(cleanInput, config.pinSalt);
  if (computed === config.pinHash) {
    return { success: true };
  }

  return { success: false, reason: "Incorrect Master PIN or Node Key." };
}

/**
 * Creates an HMAC signed session token for the local Hub administrator.
 */
export function createHubSessionToken(config: HubNodeConfig): string {
  const payload = {
    role: "school_admin",
    schoolId: config.schoolId,
    schoolName: config.schoolName,
    schoolCode: config.schoolCode,
    nodeKey: config.nodeKey,
    iat: Date.now(),
    exp: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days offline lease
  };

  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = config.nodeKey || DEFAULT_SECRET;
  const signature = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");

  return `${payloadB64}.${signature}`;
}

/**
 * Verifies an HMAC signed Hub session token.
 */
export function verifyHubSessionToken(token: string): HubNodeConfig | null {
  if (!token || !token.includes(".")) return null;
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  try {
    const raw = Buffer.from(payloadB64, "base64url").toString("utf8");
    const payload = JSON.parse(raw);

    if (payload.exp && payload.exp < Date.now()) {
      return null; // Expired
    }

    const config = getHubNodeConfig();
    const secret = config?.nodeKey || payload.nodeKey || DEFAULT_SECRET;
    const expectedSig = crypto.createHmac("sha256", secret).update(payloadB64).digest("base64url");

    if (signature !== expectedSig) {
      return null;
    }

    return {
      nodeKey: payload.nodeKey || config?.nodeKey || "",
      schoolId: payload.schoolId,
      schoolName: payload.schoolName,
      schoolCode: payload.schoolCode,
      schoolSlug: config?.schoolSlug,
      schoolLogoUrl: config?.schoolLogoUrl,
    };
  } catch {
    return null;
  }
}
