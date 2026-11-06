import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

/**
 * Fapshi Mobile Money Webhook Endpoint
 * Configured at: https://nsei-sukul.klarifypath.com/webhook
 * Receives real-time payment notifications for MTN MoMo and Orange Money.
 * Zero em dashes used.
 */
export async function POST(req: NextRequest) {
  try {
    const rawSecretHeader = req.headers.get("x-wh-secret")?.trim();
    const rawExpected = process.env.FAPSHI_WEBHOOK_SECRET || process.env.NEXT_PUBLIC_FAPSHI_WEBHOOK_SECRET || "";
    const expectedSecret = rawExpected.trim().replace(/^["']|["']$/g, "");

    // Verify webhook secret if configured
    if (expectedSecret && rawSecretHeader !== expectedSecret) {
      console.warn("[Fapshi Webhook] Unauthorized request. Header x-wh-secret mismatch.");
      return NextResponse.json({ error: "Unauthorized: Invalid secret" }, { status: 401 });
    }

    const payload = await req.json();
    console.log("[Fapshi Webhook] Received event:", JSON.stringify(payload));

    const {
      transId,
      status,
      amount,
      externalId,
      medium,
      financialTransId,
      payerName,
    } = payload;

    if (!transId || !status) {
      return NextResponse.json({ error: "Missing transId or status" }, { status: 400 });
    }

    // Only process successful payments
    if (status === "SUCCESSFUL") {
      const adminClient = createAdminClient();

      // Parse externalId: expected format is "LIC_<schoolId>_<plan>_<timestamp>" or legacy "LICENSE:<schoolId>:<plan>"
      let schoolId: string | null = null;
      let plan: string = "standard";

      if (typeof externalId === "string") {
        if (externalId.startsWith("LIC_")) {
          const parts = externalId.split("_");
          if (parts.length >= 2) {
            schoolId = parts[1];
          }
          if (parts.length >= 3 && parts[2]) {
            plan = parts[2];
          }
        } else if (externalId.startsWith("LICENSE:")) {
          const parts = externalId.split(":");
          if (parts.length >= 2) {
            schoolId = parts[1];
          }
          if (parts.length >= 3 && parts[2]) {
            plan = parts[2];
          }
        }
      }

      // Fallback: If externalId is just a UUID, use it directly
      if (!schoolId && typeof externalId === "string" && externalId.length === 36) {
        schoolId = externalId;
      }

      if (schoolId) {
        const nextYear = new Date(Date.now() + 365 * 86400000).toISOString();

        // 1. Activate or renew school annual subscription
        const { error: subError } = await adminClient
          .from("school_subscriptions")
          .upsert(
            {
              school_id: schoolId,
              plan,
              status: "active",
              current_period_end: nextYear,
              updated_at: new Date().toISOString(),
            },
            { onConflict: "school_id" }
          );

        if (subError) {
          console.error("[Fapshi Webhook] Failed to activate subscription:", subError);
        }

        // 2. Ensure school is active
        await adminClient
          .from("schools")
          .update({ is_active: true, updated_at: new Date().toISOString() })
          .eq("id", schoolId);

        // 3. Log audit event
        await adminClient.from("audit_logs").insert({
          school_id: schoolId,
          action: "FAPSHI_MOMO_LICENSE_ACTIVATED",
          resource_type: "school_subscription",
          resource_id: transId,
          details: {
            transId,
            amount,
            medium: medium || "Mobile Money",
            financialTransId: financialTransId || null,
            payerName: payerName || null,
            plan,
            externalId,
            activatedAt: new Date().toISOString(),
          },
        });

        // 4. Revalidate paths
        revalidatePath("/dashboard/schools");
        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard");

        console.log(`[Fapshi Webhook] Successfully activated annual license for school ${schoolId} via ${medium || "MoMo"}.`);
      } else {
        console.warn(`[Fapshi Webhook] Could not determine schoolId from externalId: ${externalId}`);
      }
    }

    return NextResponse.json({ received: true, status });
  } catch (err: any) {
    console.error("[Fapshi Webhook] Exception while processing event:", err);
    return NextResponse.json(
      { error: "Webhook processing error: " + (err?.message || "Unknown") },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: "active",
    gateway: "Fapshi Mobile Money (MTN / Orange)",
    endpoint: "https://nsei-sukul.klarifypath.com/webhook",
  });
}
