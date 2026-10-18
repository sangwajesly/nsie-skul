"use client";

import { useActionState } from "react";
import { assignHodAction } from "@/app/academics/actions";
import { UserRoundCog } from "lucide-react";

interface Props {
  academicYearId: string;
  departments: Array<{ id: string; name: string }>;
  headsOfDepartment: Array<{ id: string; name: string; email: string }>;
}

export default function HodAssignmentForm({
  academicYearId,
  departments,
  headsOfDepartment,
}: Props) {
  const [state, formAction, isPending] = useActionState(assignHodAction, null);

  if (!academicYearId) {
    return <p className="text-xs text-[#777777]">Set an active academic year before assigning department heads.</p>;
  }

  if (headsOfDepartment.length === 0) {
    return (
      <p className="text-xs text-[#777777]">
        Add the staff member first, then assign them the Head of Department role under Teachers &amp; Staff.
      </p>
    );
  }

  if (departments.length === 0) {
    return <p className="text-xs text-[#777777]">Add a department before assigning its head.</p>;
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <input type="hidden" name="scopeType" value="department" />
      <div>
        <label htmlFor="hod-department" className="mb-1 block text-[11px] font-semibold text-[#555555]">
          Department
        </label>
        <select
          id="hod-department"
          name="departmentId"
          required
          defaultValue=""
          className="w-full rounded-[5px] border border-[#D5D5CF] bg-white px-3 py-2 text-xs focus:border-[#191919] focus:outline-none"
        >
          <option value="" disabled>Choose a department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="hod-staff" className="mb-1 block text-[11px] font-semibold text-[#555555]">
          Head of Department
        </label>
        <select
          id="hod-staff"
          name="hodUserId"
          required
          defaultValue=""
          className="w-full rounded-[5px] border border-[#D5D5CF] bg-white px-3 py-2 text-xs focus:border-[#191919] focus:outline-none"
        >
          <option value="" disabled>Choose a staff member</option>
          {headsOfDepartment.map((staff) => (
            <option key={staff.id} value={staff.id}>{staff.name} ({staff.email})</option>
          ))}
        </select>
      </div>
      <div className="flex items-end">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-[5px] bg-[#191919] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#333333] disabled:opacity-50 sm:w-auto"
        >
          <UserRoundCog className="h-4 w-4" />
          {isPending ? "Saving..." : "Save Assignment"}
        </button>
      </div>
      {state && (
        <p aria-live="polite" className={`sm:col-span-3 text-xs ${"error" in state ? "text-red-700" : "text-[#1F5C0E]"}`}>
          {"error" in state ? state.error : state.message}
        </p>
      )}
    </form>
  );
}