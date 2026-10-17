import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { GraduationCap, Clock, ArrowRight, LogOut } from "lucide-react";
import { signOutAction } from "@/app/auth/actions";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if user already has a membership — if so, redirect to dashboard
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
    user.user_metadata?.full_name || user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDF5] p-4">
      <div className="w-full max-w-md text-center">
        {/* Brand */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-[12px] bg-[#142010] text-white mb-6">
          <GraduationCap className="w-7 h-7" />
        </div>

        <h1 className="text-2xl font-bold tracking-tight text-[#142010]">
          Welcome, {fullName}!
        </h1>
        <p className="text-sm text-[#666666] mt-2 max-w-sm mx-auto">
          Your account has been created successfully. You are not yet linked to
          any school on Nsei Skul.
        </p>

        <div className="mt-8 bg-white border border-[#E8DFC9] rounded-[10px] shadow-sm p-6 space-y-5 text-left">
          {/* Status Card */}
          <div className="flex items-start gap-3 p-3 rounded-[6px] bg-[#FFF8CF] border border-[#FBE6C2]">
            <Clock className="w-5 h-5 text-[#7A5B00] shrink-0 mt-0.5" />
            <div className="text-xs">
              <p className="font-bold text-[#7A5B00]">
                Awaiting School Assignment
              </p>
              <p className="text-[#8B7030] mt-0.5 leading-relaxed">
                A school administrator or principal must invite you and assign
                your role (Teacher, HOD, Bursar, etc.) before you can access the
                dashboard.
              </p>
            </div>
          </div>

          {/* What to do */}
          <div className="space-y-3 text-xs text-[#555555]">
            <h3 className="font-bold text-[13px] text-[#142010]">
              What happens next?
            </h3>
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EBF5E9] text-[#2A7C13] flex items-center justify-center text-[10px] font-bold border border-[#C3E4BC]">
                1
              </span>
              <p>
                Contact your school&apos;s <strong>Principal</strong> or{" "}
                <strong>Administrator</strong> and share your registered email:{" "}
                <code className="text-[#2A7C13] font-semibold bg-[#F3F9F1] px-1 py-0.5 rounded">
                  {user.email}
                </code>
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EBF5E9] text-[#2A7C13] flex items-center justify-center text-[10px] font-bold border border-[#C3E4BC]">
                2
              </span>
              <p>
                They will add you as a staff member under{" "}
                <strong>Setup &amp; Roles</strong> in their dashboard and assign
                your role (e.g. Subject Teacher, Head of Department, Bursar).
              </p>
            </div>
            <div className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EBF5E9] text-[#2A7C13] flex items-center justify-center text-[10px] font-bold border border-[#C3E4BC]">
                3
              </span>
              <p>
                Once assigned, simply{" "}
                <strong>refresh this page or sign in again</strong> and you will
                be taken directly to your school dashboard.
              </p>
            </div>
          </div>

          {/* Retry / Check */}
          <div className="flex items-center gap-3 pt-2">
            <a
              href="/onboarding"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2A7C13] hover:bg-[#236810] text-white font-semibold text-xs rounded-[6px] shadow-sm transition-all"
            >
              Check Again
              <ArrowRight className="w-3.5 h-3.5" />
            </a>
            <form action={signOutAction}>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium rounded-[6px] border border-[#D5CBB2] text-[#555555] bg-white hover:bg-[#F9F6ED] transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </form>
          </div>
        </div>

        <p className="text-[10px] text-[#AAAAAA] mt-6">
          © {new Date().getFullYear()} Nsei Skul · Built for Cameroon Secondary Education
        </p>
      </div>
    </div>
  );
}
