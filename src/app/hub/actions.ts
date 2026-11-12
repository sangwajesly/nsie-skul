"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getHubNodeConfig,
  saveHubNodeConfig,
  verifyHubAccess,
  setHubMasterPin,
  createHubSessionToken,
  HUB_SESSION_COOKIE,
} from "@/lib/hub/hub-node-store";
import { executeHubCloudSync } from "@/lib/hub/hub-cloud-sync";

export async function unlockHubWithPinAction(formData: FormData) {
  const pinOrKey = (formData.get("pinOrKey") as string) || "";
  if (!pinOrKey.trim()) {
    return { error: "Please enter your Master PIN or Node Key." };
  }

  const result = verifyHubAccess(pinOrKey);
  if (!result.success) {
    return { error: result.reason || "Incorrect PIN or Node Key." };
  }

  const config = getHubNodeConfig();
  if (!config) {
    return { error: "Hub node is not configured." };
  }

  const token = createHubSessionToken(config);
  const cookieStore = await cookies();
  cookieStore.set(HUB_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !process.env.HUB_MODE,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  });

  return { success: true };
}

export async function setupHubNodeAction(formData: FormData) {
  const nodeKey = ((formData.get("nodeKey") as string) || "").trim();
  const schoolName = ((formData.get("schoolName") as string) || "").trim();
  const schoolCode = ((formData.get("schoolCode") as string) || "").trim().toUpperCase();
  const pin = ((formData.get("pin") as string) || "").trim();

  if (!nodeKey) {
    return { error: "Please enter your Hub Node Key." };
  }
  if (!pin || pin.length < 4) {
    return { error: "Please choose a 4 to 8 digit Master PIN." };
  }

  // 1. Initial configuration save
  const config = saveHubNodeConfig({
    nodeKey,
    schoolId: `hub-${nodeKey.slice(-8)}`,
    schoolName: schoolName || "School Campus Station",
    schoolCode: schoolCode || "SCH",
  });

  // 2. Set the Master PIN
  setHubMasterPin(pin);

  // 3. Attempt initial sync if internet is connected to fetch real school name and data
  try {
    await executeHubCloudSync();
  } catch (syncErr) {
    console.log("[HubSetup] Initial online sync notice (can sync later):", syncErr);
  }

  // 4. Issue session cookie
  const refreshed = getHubNodeConfig() || config;
  const token = createHubSessionToken(refreshed);
  const cookieStore = await cookies();
  cookieStore.set(HUB_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" && !process.env.HUB_MODE,
    sameSite: "lax",
    path: "/",
    maxAge: 30 * 24 * 60 * 60,
  });

  return { success: true };
}

export async function syncHubWithCloudAction() {
  const res = await executeHubCloudSync();
  revalidatePath("/dashboard");
  return res;
}

export async function lockHubStationAction() {
  const cookieStore = await cookies();
  cookieStore.delete(HUB_SESSION_COOKIE);
  redirect("/hub/login");
}
