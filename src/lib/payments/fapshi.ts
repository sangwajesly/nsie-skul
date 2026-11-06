/**
 * Fapshi Mobile Money Payment Gateway (Cameroon)
 * Official API Integration for MTN Mobile Money & Orange Money
 * Zero em dashes used.
 */

export interface FapshiInitiatePayParams {
  amount: number;
  email?: string;
  externalId: string;
  redirectUrl?: string;
  userId?: string;
  message?: string;
}

export interface FapshiInitiatePayResponse {
  success: boolean;
  transId?: string;
  link?: string;
  error?: string;
  message?: string;
}

export interface FapshiPaymentStatus {
  transId: string;
  status: "CREATED" | "PENDING" | "SUCCESSFUL" | "FAILED" | "EXPIRED";
  medium: string | null;
  serviceName: string;
  transType: string;
  amount: number;
  email: string | null;
  redirectUrl: string | null;
  externalId: string | null;
  userId: string | null;
  webhook: string | null;
  financialTransId: string | null;
  dateInitiated: string;
  dateConfirmed: string | null;
}

export interface FapshiPaymentStatusResult {
  success: boolean;
  data?: FapshiPaymentStatus;
  error?: string;
}

function getFapshiConfig() {
  const rawUser =
    process.env.FAPSHI_API_USER ||
    process.env.FAPSHI_USER ||
    process.env.FAPSHI_APIUSER ||
    process.env.FAPSHI_API_USER_LIVE ||
    process.env.FAPSHI_LIVE_API_USER ||
    process.env.FAPSHI_USER_ID ||
    process.env.FAPSHI_API_USERID ||
    process.env.NEXT_PUBLIC_FAPSHI_API_USER ||
    process.env.NEXT_PUBLIC_FAPSHI_USER ||
    "";

  const rawKey =
    process.env.FAPSHI_API_KEY ||
    process.env.FAPSHI_KEY ||
    process.env.FAPSHI_APIKEY ||
    process.env.FAPSHI_API_KEY_LIVE ||
    process.env.FAPSHI_LIVE_API_KEY ||
    process.env.FAPSHI_TOKEN ||
    process.env.FAPSHI_API_TOKEN ||
    process.env.FAPSHI_SECRET ||
    process.env.FAPSHI_API_SECRET ||
    process.env.NEXT_PUBLIC_FAPSHI_API_KEY ||
    process.env.NEXT_PUBLIC_FAPSHI_KEY ||
    "";

  const rawBaseUrl =
    process.env.FAPSHI_BASE_URL ||
    process.env.NEXT_PUBLIC_FAPSHI_BASE_URL ||
    "https://live.fapshi.com";

  let apiUser = rawUser.trim().replace(/^["']|["']$/g, "");
  let apiKey = rawKey.trim().replace(/^["']|["']$/g, "");
  const baseUrl = rawBaseUrl.trim().replace(/^["']|["']$/g, "").replace(/\/+$/, "");

  // Dynamic scan across process.env if direct lookup did not resolve
  if (!apiUser || !apiKey) {
    for (const [k, v] of Object.entries(process.env)) {
      if (!v) continue;
      const lower = k.toLowerCase().replace(/[^a-z0-9]/g, "");
      const cleanVal = v.trim().replace(/^["']|["']$/g, "");
      if (!cleanVal) continue;

      if (!apiUser && lower.includes("fapshi") && (lower.includes("user") || lower.includes("id"))) {
        apiUser = cleanVal;
      }
      if (!apiKey && lower.includes("fapshi") && (lower.includes("key") || lower.includes("secret") || lower.includes("token"))) {
        apiKey = cleanVal;
      }
    }
  }

  if (!apiUser || !apiKey) {
    const fapshiDetectedKeys = Object.keys(process.env).filter((k) =>
      k.toLowerCase().includes("fapshi")
    );
    const userFound = Boolean(apiUser);
    const keyFound = Boolean(apiKey);

    throw new Error(
      `Fapshi API credentials not found in Vercel environment. User: ${
        userFound ? "Found" : "MISSING"
      }, API Key: ${
        keyFound ? "Found" : "MISSING"
      }. Variables detected containing 'fapshi': [${
        fapshiDetectedKeys.join(", ") || "None"
      }]. Please ensure FAPSHI_API_USER and FAPSHI_API_KEY are configured in Vercel Project Settings for the Production environment and that the deployment has finished.`
    );
  }

  return { apiUser, apiKey, baseUrl };
}

/**
 * Initiates an online Mobile Money checkout link via Fapshi.
 */
export async function initiateFapshiPayment(
  params: FapshiInitiatePayParams
): Promise<FapshiInitiatePayResponse> {
  try {
    const { apiUser, apiKey, baseUrl } = getFapshiConfig();

    if (params.amount < 100) {
      return { success: false, error: "Minimum payment amount is 100 FCFA." };
    }

    const payload: Record<string, unknown> = {
      amount: Math.round(params.amount),
      externalId: params.externalId,
    };

    if (params.email) payload.email = params.email;
    if (params.redirectUrl) payload.redirectUrl = params.redirectUrl;
    if (params.userId) payload.userId = params.userId;

    const response = await fetch(`${baseUrl}/initiate-pay`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apiuser: apiUser,
        apikey: apiKey,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok || !data.link) {
      console.error("[Fapshi] initiate-pay failed:", data);
      return {
        success: false,
        error: data.message || "Failed to initialize Mobile Money payment with Fapshi.",
      };
    }

    return {
      success: true,
      transId: data.transId,
      link: data.link,
      message: data.message,
    };
  } catch (err: any) {
    console.error("[Fapshi] Network error in initiateFapshiPayment:", err);
    return {
      success: false,
      error: err?.message || "Network error connecting to Mobile Money payment server.",
    };
  }
}

/**
 * Polls or verifies the live status of a payment transaction.
 */
export async function getFapshiPaymentStatus(
  transId: string
): Promise<FapshiPaymentStatusResult> {
  try {
    const { apiUser, apiKey, baseUrl } = getFapshiConfig();

    const response = await fetch(`${baseUrl}/payment-status/${encodeURIComponent(transId)}`, {
      method: "GET",
      headers: {
        apiuser: apiUser,
        apikey: apiKey,
      },
      cache: "no-store",
    });

    const data = await response.json();

    if (!response.ok || !data.transId) {
      console.error("[Fapshi] payment-status check failed:", data);
      return {
        success: false,
        error: data.message || "Failed to retrieve transaction status from Fapshi.",
      };
    }

    return {
      success: true,
      data: data as FapshiPaymentStatus,
    };
  } catch (err: any) {
    console.error("[Fapshi] Network error in getFapshiPaymentStatus:", err);
    return {
      success: false,
      error: err?.message || "Network error checking transaction status.",
    };
  }
}
