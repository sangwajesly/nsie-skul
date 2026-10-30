import { createClient } from "@/lib/supabase/server";
import { getUserSchools } from "@/lib/tenancy/context";
import { setActiveSchoolAction } from "@/app/schools/actions";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, GraduationCap } from "lucide-react";

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
    <main className="min-h-screen bg-[#F5F6F1] px-4 py-12 text-[#191919] sm:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-[7px] bg-[#142010] text-white">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-extrabold text-[#142010]">Nsei Sukul</span>
              <span className="text-[10px] font-semibold text-[#687064] uppercase tracking-wider">Management Systems</span>
            </div>
            <h1 className="text-xl font-bold mt-0.5">Choose a school</h1>
          </div>
        </div>

        <p className="mb-5 text-sm text-[#60665C]">
          Select the school you want to work in. You can change schools later from the dashboard.
        </p>

        <div className="divide-y divide-[#E5E5DF] border-y border-[#E5E5DF] bg-white">
          {memberships.map(({ membershipId, school, role }) => (
            <form
              key={membershipId}
              action={setActiveSchoolAction}
              className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <input type="hidden" name="schoolId" value={school.id} />
              <input type="hidden" name="returnTo" value={returnTo} />

              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[5px] border border-[#E5E5DF] bg-[#F5F6F1] text-[#2A7C13]">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h2 className="truncate text-sm font-bold">{school.name}</h2>
                  <p className="mt-0.5 truncate text-xs text-[#73786E]">
                    {school.code || school.slug} · {role.name}
                  </p>
                </div>
              </div>

              <button
                type="submit"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-[5px] bg-[#142010] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#273B20]"
              >
                Open school
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          ))}
        </div>
      </div>
    </main>
  );
}
