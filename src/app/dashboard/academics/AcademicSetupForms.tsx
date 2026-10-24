"use client";

import { useActionState } from "react";
import {
  createClassAction,
  createDepartmentAction,
  createSubjectAction,
} from "@/app/academics/actions";
import { Plus } from "lucide-react";

function ActionMessage({ state }: { state: { error: string } | { success: true; message: string } | null }) {
  if (!state) return null;

  const isError = "error" in state;
  return (
    <p aria-live="polite" className={`text-xs ${isError ? "text-red-700" : "text-[#1F5C0E]"}`}>
      {isError ? state.error : state.message}
    </p>
  );
}

export function DepartmentCreateForm() {
  const [state, formAction, isPending] = useActionState(createDepartmentAction, null);

  return (
    <form action={formAction} className="p-3.5 rounded-[6px] bg-[#FAFAF8] border border-[#E5E5DF] space-y-2.5 text-[12px]">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Add a Department</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          name="name"
          placeholder="Name (e.g. Science)"
          required
          className="sm:col-span-2 px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] focus:outline-none focus:border-[#191919]"
        />
        <input
          type="text"
          name="code"
          aria-label="Short department code"
          placeholder="Short code (SCI)"
          required
          className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] uppercase font-mono focus:outline-none focus:border-[#191919]"
        />
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#191919] hover:bg-[#333333] text-white rounded-[5px] text-[12px] font-semibold transition-colors disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{isPending ? "Adding..." : "Add Department"}</span>
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function SubjectCreateForm({
  departments,
}: {
  departments: Array<{ id: string; name: string }>;
}) {
  const [state, formAction, isPending] = useActionState(createSubjectAction, null);

  return (
    <form action={formAction} className="p-3.5 rounded-[6px] bg-[#FAFAF8] border border-[#E5E5DF] space-y-2.5 text-[12px]">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Add New Subject</div>
      {departments.length === 0 && (
        <p className="text-xs text-[#777777]">Add a department before creating a subject.</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <input
          type="text"
          name="name"
          placeholder="Subject Name (e.g. Physics)"
          required
          className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] focus:outline-none focus:border-[#191919]"
        />
        <input
          type="text"
          name="code"
          placeholder="Short code (PHY)"
          required
          className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] uppercase font-mono focus:outline-none focus:border-[#191919]"
        />
        <select
          name="departmentId"
          aria-label="Department for subject"
          required
          disabled={departments.length === 0}
          defaultValue=""
          className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] focus:outline-none focus:border-[#191919] disabled:opacity-60"
        >
          <option value="" disabled>Select Department</option>
          {departments.map((department) => (
            <option key={department.id} value={department.id}>{department.name}</option>
          ))}
        </select>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="number"
            name="defaultCoefficient"
            aria-label="Subject weight"
            placeholder="Weight (2)"
            step="0.5"
            defaultValue="2"
            className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] font-mono focus:outline-none focus:border-[#191919]"
          />
          <input
            type="number"
            name="defaultMaxMarks"
            aria-label="Maximum mark"
            placeholder="Max mark (20)"
            defaultValue="20"
            className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] font-mono focus:outline-none focus:border-[#191919]"
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={isPending || departments.length === 0}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#191919] hover:bg-[#333333] text-white rounded-[5px] text-[12px] font-semibold transition-colors disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{isPending ? "Adding..." : "Add Subject"}</span>
      </button>
      <ActionMessage state={state} />
    </form>
  );
}

export function ClassCreateForm() {
  const [state, formAction, isPending] = useActionState(createClassAction, null);

  return (
    <form action={formAction} className="p-3.5 rounded-[6px] bg-[#FAFAF8] border border-[#E5E5DF] space-y-2.5 text-[12px]">
      <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">Add a Class</div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input
          type="text"
          name="name"
          placeholder="Class name (e.g. Form 1)"
          required
          className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] focus:outline-none focus:border-[#191919]"
        />
        <input
          type="number"
          name="levelOrder"
          placeholder="Level (1)"
          min="1"
          max="12"
          defaultValue="1"
          required
          className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] font-mono focus:outline-none focus:border-[#191919]"
        />
        <select
          name="cycle"
          defaultValue="cycle_1"
          className="px-3 py-1.5 rounded-[5px] border border-[#D5D5CF] bg-white text-[12px] focus:outline-none focus:border-[#191919]"
        >
          <option value="cycle_1">O-Level</option>
          <option value="cycle_2">A-Level</option>
        </select>
      </div>
      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#191919] hover:bg-[#333333] text-white rounded-[5px] text-[12px] font-semibold transition-colors disabled:opacity-50"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>{isPending ? "Adding..." : "Add Class"}</span>
      </button>
      <ActionMessage state={state} />
    </form>
  );
}