import { Metadata } from "next";
import { getTenantContext } from "@/lib/tenancy/context";
import { redirect } from "next/navigation";
import { StatesShowcaseClient } from "./StatesShowcaseClient";

export const metadata: Metadata = {
  title: "UI System States | Nsei Sukul",
  description: "Comprehensive preview and verification of all 10 core application states: Empty, Loading, Error, Offline, Slow Network, No Search Results, Permission Denied, Session Expired, Form Validation, and Success.",
};

export default async function StatesPage() {
  const context = await getTenantContext();
  if (!context?.school?.id) {
    redirect("/login");
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="pb-4 border-b border-[#E8DFC9]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold text-[#525E4B] uppercase tracking-wider block">
              Design System &amp; Reliability Framework
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#142010] tracking-tight mt-0.5">
              10 Core Application States
            </h1>
            <p className="text-xs text-[#525E4B] mt-1 max-w-2xl leading-relaxed">
              Standardized UX states built for African and Cameroonian school environments — resilient against network drops, power cuts, staff room session timeouts, and real-time form errors.
            </p>
          </div>
        </div>
      </div>

      <StatesShowcaseClient userRole={context.role?.name || "Administrator"} />
    </div>
  );
}
