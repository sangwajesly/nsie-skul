import crypto from "crypto";
import os from "os";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

export interface HubSecurityState {
  hardwareId: string;
  isHardwareMatched: boolean;
  isClockValid: boolean;
  isDeadCmosBattery: boolean;
  isClockRolledBack: boolean;
  leaseExpiresAt: string | null;
  isLeaseActive: boolean;
  daysRemainingOnLease: number;
  uptimeHours: number;
  status: "healthy" | "grace_mode" | "expired" | "hardware_mismatch" | "clock_tampered";
  statusMessage: string;
}

const STATE_FILE_PATH = path.join(process.cwd(), ".hub-security-state.json");

/**
 * Derives a stable, cryptographically hashed hardware identifier for the current PC.
 * Combines system motherboard UUID, CPU core configuration, architecture, and network MACs.
 */
export function getHardwareFingerprint(): string {
  let hardwareSerial = "";

  // 1. Try Windows WMIC / PowerShell motherboard UUID
  if (process.platform === "win32") {
    try {
      const output = execSync("wmic csproduct get uuid", {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "ignore"],
        timeout: 2000,
      });
      const clean = output.replace(/UUID|\s+/gi, "").trim();
      if (clean && clean.length > 8 && !clean.includes("00000000")) {
        hardwareSerial = clean;
      }
    } catch {
      // Fallback if WMIC is deprecated on newer Windows 11 builds
      try {
        const psOutput = execSync(
          'powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"',
          { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 3000 }
        ).trim();
        if (psOutput && psOutput.length > 8) {
          hardwareSerial = psOutput;
        }
      } catch {
        // Fallback to network MACs below
      }
    }
  } else if (process.platform === "linux") {
    // Linux machine-id
    try {
      if (fs.existsSync("/etc/machine-id")) {
        hardwareSerial = fs.readFileSync("/etc/machine-id", "utf8").trim();
      } else if (fs.existsSync("/var/lib/dbus/machine-id")) {
        hardwareSerial = fs.readFileSync("/var/lib/dbus/machine-id", "utf8").trim();
      }
    } catch {
      // Fallback to network MACs
    }
  }

  // 2. Gather network MAC addresses as secondary hardware anchor
  const macAddresses: string[] = [];
  try {
    const interfaces = os.networkInterfaces();
    for (const name in interfaces) {
      const ifaceList = interfaces[name];
      if (ifaceList) {
        for (const iface of ifaceList) {
          if (!iface.internal && iface.mac && iface.mac !== "00:00:00:00:00:00") {
            macAddresses.push(iface.mac.toLowerCase());
          }
        }
      }
    }
  } catch {
    // Ignore interface error
  }
  macAddresses.sort();

  // 3. Combine hardware parameters into canonical digest
  const rawSeed = [
    hardwareSerial || "GENERIC_HOST",
    os.hostname(),
    os.arch(),
    os.cpus().length,
    macAddresses.join(";"),
  ].join("::");

  const hash = crypto.createHash("sha256").update(rawSeed).digest("hex");
  return `hw_${hash.slice(0, 24)}`;
}

/**
 * Checks system clock integrity and defends against clock rollbacks
 * while gracefully tolerating dead CMOS battery resets (e.g. year < 2025).
 */
export function checkClockIntegrity(): {
  isClockValid: boolean;
  isDeadCmosBattery: boolean;
  isClockRolledBack: boolean;
  lastObservedTimestamp: number;
} {
  const currentTimestamp = Date.now();
  const currentYear = new Date().getFullYear();

  // 1. Detect dead CMOS battery (computer lost power and reverted to manufacturing era)
  // School desktops in Cameroon often reset to 2010, 2012, or 2019 when unplugged.
  const isDeadCmosBattery = currentYear < 2025;

  let lastObservedTimestamp = 0;
  let isClockRolledBack = false;

  try {
    if (fs.existsSync(STATE_FILE_PATH)) {
      const data = JSON.parse(fs.readFileSync(STATE_FILE_PATH, "utf8"));
      if (typeof data.lastObservedTimestamp === "number") {
        lastObservedTimestamp = data.lastObservedTimestamp;
      }
    }
  } catch {
    lastObservedTimestamp = 0;
  }

  // 2. Detect deliberate clock rollback:
  // If the clock is in the modern era (2025+) but moved backward by more than 1 hour (3600000ms)
  // compared to the highest timestamp previously recorded.
  if (!isDeadCmosBattery && lastObservedTimestamp > 0) {
    if (currentTimestamp < lastObservedTimestamp - 3600000) {
      isClockRolledBack = true;
    }
  }

  // 3. Monotonically record the highest timestamp observed
  if (!isDeadCmosBattery && currentTimestamp > lastObservedTimestamp) {
    try {
      fs.writeFileSync(
        STATE_FILE_PATH,
        JSON.stringify({
          lastObservedTimestamp: currentTimestamp,
          updatedAt: new Date().toISOString(),
        }),
        "utf8"
      );
    } catch {
      // Ignore write error in read-only setups
    }
  }

  const isClockValid = !isClockRolledBack;

  return {
    isClockValid,
    isDeadCmosBattery,
    isClockRolledBack,
    lastObservedTimestamp: Math.max(lastObservedTimestamp, currentTimestamp),
  };
}

/**
 * Comprehensive security validation for an on-premise School Hub instance.
 * Checks hardware binding, lease expiration, clock validity, and runtime status.
 */
export function verifyHubNodeSecurity(registeredHardwareId?: string | null, leaseExpiresAt?: string | null): HubSecurityState {
  const currentHwId = getHardwareFingerprint();
  const clockCheck = checkClockIntegrity();
  const uptimeHours = Math.round((os.uptime() / 3600) * 10) / 10;

  // 1. Hardware Binding Check
  // If node was registered with a specific hardware ID, verify it matches the current machine.
  const isHardwareMatched =
    !registeredHardwareId ||
    registeredHardwareId === currentHwId ||
    process.env.NODE_ENV !== "production";

  // 2. Lease Expiration Check
  let isLeaseActive = true;
  let daysRemainingOnLease = 30;

  if (leaseExpiresAt) {
    const expireTime = new Date(leaseExpiresAt).getTime();
    const now = Date.now();
    const diffMs = expireTime - now;

    daysRemainingOnLease = Math.max(0, Math.ceil(diffMs / 86400000));
    isLeaseActive = diffMs > 0;
  }

  // 3. Determine Overall Security Health Status
  let status: HubSecurityState["status"] = "healthy";
  let statusMessage = "School Hub running in optimal offline state.";

  if (!isHardwareMatched) {
    status = "hardware_mismatch";
    statusMessage = "Hardware signature mismatch. This School Hub node is bound to a different physical computer.";
  } else if (clockCheck.isClockRolledBack) {
    status = "clock_tampered";
    statusMessage = "System clock discrepancy detected. Please connect to internet briefly to recalibrate the clock.";
  } else if (!isLeaseActive) {
    status = "expired";
    statusMessage = "Offline 30-day lease has concluded. Connect to a mobile hotspot for 60 seconds to refresh your license.";
  } else if (clockCheck.isDeadCmosBattery) {
    status = "grace_mode";
    statusMessage = "Notice: Computer CMOS clock reset detected. Connect to Wi-Fi hotspot briefly to synchronize time.";
  } else if (daysRemainingOnLease <= 3) {
    status = "grace_mode";
    statusMessage = `Warning: ${daysRemainingOnLease} day(s) remaining on offline lease. Please connect to internet to renew.`;
  }

  return {
    hardwareId: currentHwId,
    isHardwareMatched,
    isClockValid: clockCheck.isClockValid,
    isDeadCmosBattery: clockCheck.isDeadCmosBattery,
    isClockRolledBack: clockCheck.isClockRolledBack,
    leaseExpiresAt: leaseExpiresAt || null,
    isLeaseActive,
    daysRemainingOnLease,
    uptimeHours,
    status,
    statusMessage,
  };
}
