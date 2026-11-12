import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const hubKey = req.headers.get("x-hub-key") || body.nodeKey;
  const startTime = Date.now();
  const supabase = createAdminClient();

  let schoolId: string | null = null;
  let hub: any = null;

  // 1. Authenticate via Hub Node Key (Station mode)
  if (hubKey) {
    const { data: hubNode, error: hubError } = await supabase
      .from("school_hubs")
      .select("id, school_id, status, lease_expires_at, hub_name, local_ip")
      .eq("node_key", hubKey)
      .maybeSingle();

    if (hubError || !hubNode) {
      return NextResponse.json({ error: "Invalid Hub authentication key." }, { status: 403 });
    }

    if (hubNode.status !== "active") {
      return NextResponse.json(
        { error: `This Hub node has been marked as ${hubNode.status}. Contact your school administrator.` },
        { status: 403 }
      );
    }

    hub = hubNode;
    schoolId = hubNode.school_id;
  } else {
    // 2. Fallback: Authenticate via Teacher/User session (Direct Cloud Auto-Sync)
    try {
      const userClient = await createClient();
      const {
        data: { user },
      } = await userClient.auth.getUser();

      if (user) {
        const { data: mem } = await supabase
          .from("school_memberships")
          .select("school_id")
          .eq("user_id", user.id)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

        if (mem?.school_id) {
          schoolId = mem.school_id;
        }
      }
    } catch {
      // Non-blocking
    }

    if (!schoolId) {
      return NextResponse.json(
        { error: "Authentication required. Provide x-hub-key header or active user session." },
        { status: 401 }
      );
    }
  }

  const { localIp, pushData, lastPulledAt } = body;

  // 2. Check School Subscription & Lease Extension
  const { data: sub } = await supabase
    .from("school_subscriptions")
    .select("status, current_period_end")
    .eq("school_id", schoolId)
    .maybeSingle();

  const isSubActive = sub?.status === "active";
  const newLeaseExpiresAt = isSubActive
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : hub.lease_expires_at;

  let itemsPushed = 0;
  let itemsPulled = 0;

  // 3. Process PUSH: Payments from Local Hub
  if (pushData?.payments && Array.isArray(pushData.payments) && pushData.payments.length > 0) {
    for (const p of pushData.payments) {
      if (!p.clientMutationId || !p.studentBillId || !p.amount) continue;

      const { data: existing } = await supabase
        .from("fee_payments")
        .select("id")
        .eq("school_id", schoolId)
        .eq("client_mutation_id", p.clientMutationId)
        .maybeSingle();

      if (!existing) {
        const { error: insErr } = await supabase.from("fee_payments").insert({
          school_id: schoolId,
          student_bill_id: p.studentBillId,
          student_id: p.studentId,
          academic_year_id: p.academicYearId,
          receipt_number: p.receiptNumber,
          amount: p.amount,
          payment_method: p.paymentMethod || "cash",
          transaction_ref: p.transactionRef || null,
          term_number: p.termNumber || 1,
          payment_date: p.paymentDate || new Date().toISOString().split("T")[0],
          client_mutation_id: p.clientMutationId,
          device_code: p.deviceCode || "HUB",
          recorded_offline: true,
          client_recorded_at: p.clientRecordedAt || new Date().toISOString(),
          synced_at: new Date().toISOString(),
        });

        if (!insErr) {
          itemsPushed++;
          // Recalculate bill balance
          const { data: bill } = await supabase
            .from("student_bills")
            .select("total_billed, total_paid")
            .eq("id", p.studentBillId)
            .single();

          if (bill) {
            const { data: allP } = await supabase
              .from("fee_payments")
              .select("amount")
              .eq("student_bill_id", p.studentBillId);

            const totalPaid = (allP || []).reduce((s, r) => s + Number(r.amount || 0), 0);
            const totalBilled = Number(bill.total_billed);
            const status = totalPaid >= totalBilled ? "paid" : totalPaid > 0 ? "partial" : "unpaid";

            await supabase
              .from("student_bills")
              .update({ total_paid: totalPaid, status, updated_at: new Date().toISOString() })
              .eq("id", p.studentBillId);
          }
        }
      }
    }
  }

  // 4. Process PUSH: Marks from Local Hub or Teacher Outbox
  const marksToUpsert =
    (pushData?.marks && Array.isArray(pushData.marks) ? pushData.marks : null) ||
    (Array.isArray(body.marks)
      ? body.marks.map((m: any) => ({
          academicYearId: body.academicYearId,
          termId: body.termId,
          sequenceId: body.sequenceId,
          classStreamId: body.classStreamId,
          subjectId: body.subjectId,
          studentId: m.studentId,
          score: m.status === "present" ? m.score : null,
          maxMarks: body.maxMarks || 20,
          status: m.status || "present",
          remarks: m.remarks || null,
        }))
      : []);

  if (marksToUpsert.length > 0) {
    const { error: marksErr } = await supabase.from("assessment_marks").upsert(
      marksToUpsert.map((m: any) => ({
        school_id: schoolId,
        academic_year_id: m.academicYearId,
        term_id: m.termId,
        sequence_id: m.sequenceId,
        class_stream_id: m.classStreamId,
        subject_id: m.subjectId,
        student_id: m.studentId,
        score: m.score,
        max_marks: m.maxMarks || 20,
        status: m.status || "present",
        remarks: m.remarks || null,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: "sequence_id,class_stream_id,subject_id,student_id" }
    );

    if (!marksErr) {
      itemsPushed += marksToUpsert.length;
    }
  }

  // 5. Gather PULL: School Snapshot, Remote Teacher Marks & Class Assignments
  let marksQuery = supabase
    .from("assessment_marks")
    .select("academic_year_id, term_id, sequence_id, class_stream_id, subject_id, student_id, score, max_marks, status, remarks, updated_at")
    .eq("school_id", schoolId);

  if (lastPulledAt) {
    marksQuery = marksQuery.gt("updated_at", lastPulledAt);
  }

  const [schoolRes, studentsRes, yearsRes, teacherAssignmentsRes, remoteMarksRes] = await Promise.all([
    supabase.from("schools").select("*").eq("id", schoolId).single(),
    supabase.from("students").select("*").eq("school_id", schoolId).eq("status", "active"),
    supabase.from("academic_years").select("*").eq("school_id", schoolId),
    supabase.from("teacher_assignments").select("*").eq("school_id", schoolId),
    marksQuery.limit(500),
  ]);

  const remoteMarks = remoteMarksRes.data || [];
  itemsPulled =
    (studentsRes.data?.length || 0) +
    (yearsRes.data?.length || 0) +
    (teacherAssignmentsRes.data?.length || 0) +
    remoteMarks.length;

  // 6. Update Hub Metadata & Log Sync Session
  const durationMs = Date.now() - startTime;
  if (hub?.id) {
    await Promise.all([
      supabase
        .from("school_hubs")
        .update({
          local_ip: localIp || hub.local_ip,
          lease_expires_at: newLeaseExpiresAt,
          last_heartbeat_at: new Date().toISOString(),
          last_sync_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", hub.id),

      supabase.from("hub_sync_logs").insert({
        school_id: schoolId,
        hub_id: hub.id,
        direction: "bidirectional",
        items_pushed: itemsPushed,
        items_pulled: itemsPulled,
        status: "success",
        duration_ms: durationMs,
      }),
    ]);
  }

  return NextResponse.json({
    success: true,
    hubName: hub?.hub_name || "Direct Sync Station",
    leaseExpiresAt: newLeaseExpiresAt,
    isSubscriptionActive: isSubActive,
    itemsPushed,
    pulledData: {
      school: schoolRes.data,
      students: studentsRes.data || [],
      academicYears: yearsRes.data || [],
      teacherAssignments: teacherAssignmentsRes.data || [],
      remoteMarks,
    },
    syncCursor: new Date().toISOString(),
    durationMs,
  });
}
