import { createClient } from "@/lib/supabase/server";
import { getUserSchools } from "@/lib/tenancy/context";
import { setActiveSchoolAction } from "@/app/schools/actions";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, School as SchoolIcon, CheckCircle2 } from "lucide-react";
import { NseiLogoMark } from "@/components/brand/NseiLogo";

interface SelectSchoolPageProps {
  searchParams: Promise<{ returnTo?: string | string[] }>;
}

export default async function SelectSchoolPage({ searchParams }: SelectSchoolPageProps) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const memberships = await getUserSchools();

  if (memberships.length === 0) {
    redirect("/onboarding");
  }

  if (memberships.length === 1) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const returnTo = typeof params.returnTo === "string" ? params.returnTo : "/dashboard";

  return (
    <main className="min-h-screen bg-[#FFFDF5] px-4 py-12 text-[#191919] sm:py-16">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <NseiLogoMark size="lg" priority />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#142010]">Nsei Sukul</span>
              <span className="text-[10px] font-semibold text-[#687064] uppercase tracking-wider">
                Management Systems
              </span>
            </div>
            <h1 className="text-2xl font-black text-[#142010] mt-0.5">Which school are you grading today?</h1>
          </div>
        </div>

        <p className="text-sm text-[#60665C]">
          You teach at multiple institutions. Select your active institution below. You can easily switch between your schools anytime from your top navigation bar.
        </p>

        {/* School Cards Grid */}
        <div className="grid grid-cols-1 gap-3.5">
          {memberships.map(({ membershipId, school, role }) => (
            <form
              key={membershipId}
              action={setActiveSchoolAction}
              className="group rounded-[10px] border border-[#E8DFC9] bg-white p-5 shadow-xs hover:border-[#2A7C13] hover:shadow-md transition-all flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <input type="hidden" name="schoolId" value={school.id} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="flex min-w-0 items-center gap-3.5">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[8px] border border-[#C3E4BC] bg-[#EBF5E9] text-[#1F5C0E] group-hover:bg-[#2A7C13] group-hover:text-white transition-colors">
                  <Building2 className="h-6 w-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-extrabold text-[#142010] group-hover:text-[#2A7C13] transition-colors">
                    {school.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-[#7A5B00] bg-[#FFF8CF] px-2 py-0.5 rounded border border-[#FBE6C2]">
                      {school.code || school.slug.toUpperCase()}
                    </span>
                    <span className="text-xs text-[#555555] font-medium">
                      {role.name}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[6px] bg-[#142010] px-5 py-2.5 text-xs font-bold text-white transition-all hover:bg-[#2A7C13] shadow-xs cursor-pointer"
              >
                <span>Open School</span>
                <ArrowRight className="h-4 w-4 text-[#86EFAC]" />
              </button>
            </form>
          ))}
        </div>

        <div className="p-3.5 rounded-[8px] bg-[#EBF5E9] border border-[#C3E4BC] text-xs text-[#1F5C0E] flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2A7C13]" />
          <span>
            <strong>Pro-tip for teachers:</strong> You do not need to log out to switch schools. Look for your school name badge at the top of your dashboard to switch with one tap.
          </span>
        </div>
      </div>
    </main>
  );
}
