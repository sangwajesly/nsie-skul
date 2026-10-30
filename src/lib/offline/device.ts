"use client";

import { registerSchoolDeviceAction } from "@/app/offline/actions";
import { idbUpdateKv, kvGet, kvSet } from "./idb";

export interface DeviceIdentity {
  schoolId: string;
  deviceId: string | null; // null until registered with the server
  deviceCode: string;      // 'D3' when registered, 'X7K2' temporary fallback
  registered: boolean;
}

const identityKey = (schoolId: string) => `device:${schoolId}`;
const counterKey = (schoolId: string, deviceCode: string) => `receipt-counter:${schoolId}:${deviceCode}`;

function describeBrowser(): string {
  if (typeof navigator === "undefined") return "Unknown device";
  const ua = navigator.userAgent;
  const browser = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const os = /Windows/.test(ua) ? "Windows" : /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Unknown OS";
  return `${browser} on ${os}`;
}

function randomFallbackCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "X";
  for (let i = 0; i < 3; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function getDeviceIdentity(schoolId: string): Promise<DeviceIdentity | undefined> {
  return kvGet<DeviceIdentity>(identityKey(schoolId));
}

/**
 * Makes sure this device has a school-unique code. Registers with the server
 * when online; otherwise falls back to a temporary random code so the bursar
 * can still issue receipts. The server resolves the (very unlikely) collision.
 */
export async function ensureDeviceIdentity(schoolId: string): Promise<DeviceIdentity> {
  const current = await getDeviceIdentity(schoolId);
  if (current?.registered) {
    // Refresh last_seen in the background when online; never block on it.
    if (typeof navigator !== "undefined" && navigator.onLine) {
      registerSchoolDeviceAction({ deviceId: current.deviceId }).catch(() => {});
    }
    return current;
  }

  if (typeof navigator !== "undefined" && navigator.onLine) {
    try {
      const res = await registerSchoolDeviceAction({ deviceId: null, label: describeBrowser() });
      if (res && "deviceCode" in res && res.deviceCode && res.deviceId) {
        const identity: DeviceIdentity = {
          schoolId,
          deviceId: res.deviceId,
          deviceCode: res.deviceCode,
          registered: true,
        };
        await kvSet(identityKey(schoolId), identity);
        return identity;
      }
    } catch {
      // fall through to temporary identity
    }
  }

  if (current) return current;

  const temporary: DeviceIdentity = {
    schoolId,
    deviceId: null,
    deviceCode: randomFallbackCode(),
    registered: false,
  };
  await kvSet(identityKey(schoolId), temporary);
  return temporary;
}

/**
 * Issues the next offline receipt number for this device, e.g. GBHS-2026-D3-0007.
 */
export async function nextOfflineReceiptNumber(schoolId: string, prefix: string, year = "2026"): Promise<{ receiptNumber: string; deviceCode: string }> {
  const identity = await ensureDeviceIdentity(schoolId);
  const seq = await idbUpdateKv<number>(counterKey(schoolId, identity.deviceCode), (n) => (n || 0) + 1);
  const receiptNumber = `${prefix || "REC"}-${year}-${identity.deviceCode}-${seq.toString().padStart(4, "0")}`;
  return { receiptNumber, deviceCode: identity.deviceCode };
}
