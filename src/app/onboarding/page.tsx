import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingClient } from "./OnboardingClient";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has an active school membership — if so, direct to dashboard
  const { data: memberships } = await supabase
    .from("school_memberships")
    .select("id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1);

  if (memberships && memberships.length > 0) {
    redirect("/dashboard");
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
