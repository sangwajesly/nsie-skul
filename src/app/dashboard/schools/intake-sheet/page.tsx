import { redirect } from "next/navigation";
import { getTenantContext, SUPER_ADMIN_EMAILS } from "@/lib/tenancy/context";
import { createAdminClient } from "@/lib/supabase/admin";
import { PrintableIntakeSheetClient } from "./PrintableIntakeSheetClient";

export const metadata = {
  title: "Staffroom Intake & Assignment Sheet (A4) | Nsei Sukul",
  description: "Printable teacher data intake and subject allocation register for Cameroon secondary schools.",
};

interface IntakeSheetPageProps {
  searchParams?: Promise<{ schoolId?: string }>;
}

export default async function IntakeSheetPage({ searchParams }: IntakeSheetPageProps) {
  const context = await getTenantContext();

  if (!context) {
    redirect("/login");
  }

  const isSuperAdmin =
    context.isSuperAdmin ||
    context.role.code === "superadmin" ||
    SUPER_ADMIN_EMAILS.includes(context.user.email?.toLowerCase() || "");

  const isAdmin = ["school_admin", "principal", "superadmin"].includes(context.role.code);

  if (!isSuperAdmin && !isAdmin) {
    redirect("/dashboard");
  }

  const adminClient = createAdminClient();

  // 1. Fetch all available schools for the header switcher
  const { data: allSchools } = await adminClient
    .from("schools")
    .select("id, name, code, address, motto")
    .eq("is_active", true)
    .order("name", { ascending: true });

  const schools = allSchools || [
    {
      id: context.school.id,
      name: context.school.name,
      code: context.school.code,
      address: context.school.address,
      motto: context.school.motto,
    },
  ];

  const resolvedParams = searchParams ? await searchParams : {};
  const targetSchoolId = resolvedParams?.schoolId || context.school.id;

  const selectedSchool =
    schools.find((s) => s.id === targetSchoolId) || schools[0];

  // 2. Fetch classes and subjects for reference box
  const [{ data: classesData }, { data: subjectsData }] = await Promise.all([
    adminClient
      .from("class_streams")
      .select("name")
      .eq("school_id", selectedSchool.id)
      .order("name", { ascending: true })
      .limit(15),
    adminClient
      .from("subjects")
      .select("name")
      .eq("school_id", selectedSchool.id)
      .order("name", { ascending: true })
      .limit(15),
  ]);

  const classesList = classesData?.map((c) => c.name) || [];
  const subjectsList = subjectsData?.map((s) => s.name) || [];

  return (
    <PrintableIntakeSheetClient
      schools={schools}
      selectedSchool={selectedSchool}
      classesList={classesList}
      subjectsList={subjectsList}
    />
  );
}
