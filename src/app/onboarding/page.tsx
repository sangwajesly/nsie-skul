import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./OnboardingClient";
import { SUPER_ADMIN_EMAILS } from "@/lib/tenancy/context";

interface OnboardingPageProps {
  searchParams?: Promise<{ mode?: string }>;
}

export default async function OnboardingPage({ searchParams }: OnboardingPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const resolvedParams = searchParams ? await searchParams : {};
  const isExplicitNew = resolvedParams?.mode === "new";

  const isSuperAdmin = SUPER_ADMIN_EMAILS.includes(
    user.email?.toLowerCase() || ""
  );

  // If user already has an active membership and is not explicitly adding a new school or superadmin, direct to dashboard
  if (!isExplicitNew && !isSuperAdmin) {
    const { data: memberships } = await supabase
      .from("school_memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (memberships && memberships.length > 0) {
      redirect("/dashboard");
    }
  }

  const fullName =
    user.user_metadata?.full_name || user.email?.split("@")[0] || "Educator";

  return (
    <OnboardingClient
      userId={user.id}
      userEmail={user.email || ""}
      fullName={fullName}
    />
  );
}
