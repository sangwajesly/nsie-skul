import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getHubNodeConfig, HUB_SESSION_COOKIE, isSchoolHubMode } from "@/lib/hub/hub-node-store";

export async function POST(req: NextRequest) {
  let body: any = {};
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const localConfig = getHubNodeConfig();
  const hubCookie = req.cookies.get(HUB_SESSION_COOKIE)?.value;
  const hubKey = req.headers.get("x-hub-key") || body.nodeKey || (hubCookie ? localConfig?.nodeKey : null) || (isSchoolHubMode() ? localConfig?.nodeKey : null);
  const startTime = Date.now();
  const supabase = createAdminClient();

  let schoolId: string | null = null;
  let hub: any = null;

  // 1. Authenticate via Hub Node Key (Station mode)
  if (hubKey) {
    try {
      const { data: hubNode, error: hubError } = await supabase
        .from("school_hubs")
        .select("id, school_id, status, lease_expires_at, hub_name, local_ip")
        .eq("node_key", hubKey)
        .maybeSingle();

      if (hubError || !hubNode) {
        if (localConfig && localConfig.nodeKey === hubKey) {
          hub = {
            id: localConfig.schoolId,
            school_id: localConfig.schoolId,
            status: "active",
            lease_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            hub_name: localConfig.schoolName,
            local_ip: "127.0.0.1",
          };
          schoolId = localConfig.schoolId;
        } else {
          return NextResponse.json({ error: "Invalid Hub authentication key." }, { status: 403 });
        }
      } else {
        if (hubNode.status !== "active") {
          return NextResponse.json(
            { error: `This Hub node has been marked as ${hubNode.status}. Contact your school administrator.` },
            { status: 403 }
          );
        }

        hub = hubNode;
        schoolId = hubNode.school_id;
      }
    } catch {
      if (localConfig && localConfig.nodeKey === hubKey) {
        hub = {
          id: localConfig.schoolId,
          school_id: localConfig.schoolId,
          status: "active",
          lease_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          hub_name: localConfig.schoolName,
          local_ip: "127.0.0.1",
        };
        schoolId = localConfig.schoolId;
      }
    }
  } else {
    // 2. Fallback: Authenticate via Teacher/User session or local Hub Admin cookie
    if (hubCookie && localConfig?.schoolId) {
      schoolId = localConfig.schoolId;
    } else {
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

  // 4b. Process PUSH: Outbox Mutations from Local Hub
  if (pushData?.mutations && Array.isArray(pushData.mutations) && pushData.mutations.length > 0) {
    for (const m of pushData.mutations) {
      if (!m.entityType || !m.payload) continue;
      try {
        if (m.entityType === "classes") {
          if (m.mutationType === "DELETE") {
            await supabase.from("classes").delete().eq("id", m.entityId).eq("school_id", schoolId);
          } else {
            await supabase.from("classes").upsert({
              id: m.payload.id || m.entityId,
              school_id: schoolId,
              name: m.payload.name,
              level_order: m.payload.level_order || 1,
              cycle: m.payload.cycle || "cycle_1",
            });
          }
          itemsPushed++;
        } else if (m.entityType === "class_streams") {
          if (m.mutationType === "DELETE") {
            await supabase.from("class_streams").delete().eq("id", m.entityId).eq("school_id", schoolId);
          } else {
            await supabase.from("class_streams").upsert({
              id: m.payload.id || m.entityId,
              school_id: schoolId,
              class_id: m.payload.class_id,
              academic_year_id: m.payload.academic_year_id,
              name: m.payload.name,
              stream_tag: m.payload.stream_tag || null,
            });
          }
          itemsPushed++;
        } else if (m.entityType === "subjects") {
          if (m.mutationType === "DELETE") {
            await supabase.from("subjects").delete().eq("id", m.entityId).eq("school_id", schoolId);
          } else {
            await supabase.from("subjects").upsert({
              id: m.payload.id || m.entityId,
              school_id: schoolId,
              department_id: m.payload.department_id || null,
              name: m.payload.name,
              code: m.payload.code,
              default_coefficient: m.payload.default_coefficient || 2,
              default_max_marks: m.payload.default_max_marks || 20,
            });
          }
          itemsPushed++;
        } else if (m.entityType === "students") {
          if (m.mutationType === "DELETE") {
            await supabase.from("students").delete().eq("id", m.entityId).eq("school_id", schoolId);
          } else {
            await supabase.from("students").upsert({
              id: m.payload.id || m.entityId,
              school_id: schoolId,
              matricule: m.payload.matricule,
              first_name: m.payload.first_name,
              last_name: m.payload.last_name,
              gender: m.payload.gender || "M",
              status: "active",
            });
            if (m.payload.class_stream_id && m.payload.academic_year_id) {
              await supabase.from("enrolments").upsert(
                {
                  id: m.payload.enrolment_id || crypto.randomUUID(),
                  school_id: schoolId,
                  student_id: m.payload.id || m.entityId,
                  academic_year_id: m.payload.academic_year_id,
                  class_stream_id: m.payload.class_stream_id,
                  status: "active",
                },
                { onConflict: "academic_year_id,student_id" }
              );
            }
          }
          itemsPushed++;
        } else if (m.entityType === "school_memberships") {
          if (m.mutationType === "DELETE") {
            await supabase.from("school_memberships").delete().eq("id", m.payload.id || m.entityId).eq("school_id", schoolId);
          } else {
            if (m.payload.phone) {
              await supabase.from("user_profiles").upsert({
                id: m.payload.user_id,
                full_name: m.payload.fullName || "Teacher",
                email: `teacher_${m.payload.phone}@staff.nseisukul.internal`,
                phone: m.payload.phone,
              });
            }
            await supabase.from("school_memberships").upsert({
              id: m.payload.id || m.entityId,
              school_id: schoolId,
              user_id: m.payload.user_id,
              role_id: m.payload.role_id,
              title: m.payload.title || "Teacher",
              access_code: m.payload.access_code,
              status: m.payload.status || "active",
            });
          }
          itemsPushed++;
        }
      } catch (mutErr) {
        console.warn("[sync] Notice: Mutation error:", mutErr);
      }
    }
  }

  // 5. Gather PULL: School Snapshot, Remote Teacher Marks & Class Assignments
  let marksQuery = supabase
    .from("assessment_marks")
    .select("school_id, academic_year_id, term_id, sequence_id, class_stream_id, subject_id, student_id, score, max_marks, status, remarks, updated_at")
    .eq("school_id", schoolId);

  if (lastPulledAt) {
    marksQuery = marksQuery.gt("updated_at", lastPulledAt);
  }

  const [
    schoolRes,
    yearsRes,
    termsRes,
    sequencesRes,
    departmentsRes,
    classesRes,
    classStreamsRes,
    subjectsRes,
    classSubjectsRes,
    studentsRes,
    enrolmentsRes,
    teacherAssignmentsRes,
    remoteMarksRes,
    membershipsRes,
    rolesRes,
    staffProfilesRes,
    subjectCompetenciesRes,
    termResultsRes,
  ] = await Promise.all([
    supabase.from("schools").select("*").eq("id", schoolId).single(),
    supabase.from("academic_years").select("*").eq("school_id", schoolId),
    supabase.from("terms").select("*").eq("school_id", schoolId),
    supabase.from("evaluation_sequences").select("*").eq("school_id", schoolId),
    supabase.from("departments").select("*").eq("school_id", schoolId),
    supabase.from("classes").select("*").eq("school_id", schoolId),
    supabase.from("class_streams").select("*").eq("school_id", schoolId),
    supabase.from("subjects").select("*").eq("school_id", schoolId),
    supabase.from("class_subjects").select("*").eq("school_id", schoolId),
    supabase.from("students").select("*").eq("school_id", schoolId).eq("status", "active"),
    supabase.from("enrolments").select("*").eq("school_id", schoolId),
    supabase.from("teacher_assignments").select("*").eq("school_id", schoolId),
    marksQuery.limit(500),
    supabase.from("school_memberships").select("id, school_id, user_id, role_id, title, access_code, status").eq("school_id", schoolId),
    supabase.from("roles").select("*"),
    supabase.from("user_profiles").select("id, full_name, email, phone"),
    supabase.from("subject_competencies").select("*").eq("school_id", schoolId),
    supabase.from("term_results").select("*").eq("school_id", schoolId),
  ]);

  const remoteMarks = remoteMarksRes.data || [];
  itemsPulled =
    (studentsRes.data?.length || 0) +
    (yearsRes.data?.length || 0) +
    (termsRes.data?.length || 0) +
    (sequencesRes.data?.length || 0) +
    (classesRes.data?.length || 0) +
    (classStreamsRes.data?.length || 0) +
    (subjectsRes.data?.length || 0) +
    (enrolmentsRes.data?.length || 0) +
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
    itemsPulled,
    pulledData: {
      school: schoolRes.data,
      students: studentsRes.data || [],
      academicYears: yearsRes.data || [],
      terms: termsRes.data || [],
      sequences: sequencesRes.data || [],
      departments: departmentsRes.data || [],
      classes: classesRes.data || [],
      classStreams: classStreamsRes.data || [],
      subjects: subjectsRes.data || [],
      classSubjects: classSubjectsRes.data || [],
      enrolments: enrolmentsRes.data || [],
      teacherAssignments: teacherAssignmentsRes.data || [],
      remoteMarks,
      memberships: membershipsRes.data || [],
      roles: rolesRes.data || [],
      staffProfiles: staffProfilesRes.data || [],
      subjectCompetencies: subjectCompetenciesRes.data || [],
      termResults: termResultsRes.data || [],
      staffUsers: (membershipsRes.data || []).map((m: any) => ({
        id: m.user_id,
        email: `staff_${String(m.user_id).slice(0, 8)}@school.local`,
      })),
    },
    syncCursor: new Date().toISOString(),
    durationMs,
  });
}
