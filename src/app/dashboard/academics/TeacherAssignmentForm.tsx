"use client";

import { useActionState } from "react";
import { assignTeacherAction } from "@/app/academics/actions";
import { UserRoundPlus } from "lucide-react";

interface Props {
  academicYearId: string;
  teachers: Array<{ id: string; name: string; email: string }>;
  classGroups: Array<{ id: string; name: string }>;
  subjects: Array<{ id: string; name: string }>;
}

export default function TeacherAssignmentForm({
  academicYearId,
  teachers,
  classGroups,
  subjects,
}: Props) {
  const [state, formAction, isPending] = useActionState(assignTeacherAction, null);

  if (!academicYearId) {
    return <p className="text-xs text-[#777777]">Set a current school year before assigning teachers.</p>;
  }

  if (teachers.length === 0) {
    return (
      <p className="text-xs text-[#777777]">
        Add the teacher under Teachers &amp; Staff and give them the Teacher role first.
      </p>
    );
  }

  if (classGroups.length === 0 || subjects.length === 0) {
    return <p className="text-xs text-[#777777]">Add a class group and subject before assigning a teacher.</p>;
  }

  return (
    <form action={formAction} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      <input type="hidden" name="academicYearId" value={academicYearId} />
      <div>
        <label htmlFor="teacher-assignment-teacher" className="mb-1 block text-[11px] font-semibold text-[#555555]">
          Teacher
        </label>
        <select
          id="teacher-assignment-teacher"
          name="teacherUserId"
          required
          defaultValue=""
          className="w-full rounded-[5px] border border-[#D5D5CF] bg-white px-3 py-2 text-xs focus:border-[#191919] focus:outline-none"
        >
          <option value="" disabled>Choose a teacher</option>
          {teachers.map((teacher) => (
            <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="teacher-assignment-class" className="mb-1 block text-[11px] font-semibold text-[#555555]">
          Class group
        </label>
        <select
          id="teacher-assignment-class"
          name="classStreamId"
          required
          defaultValue=""
          className="w-full rounded-[5px] border border-[#D5D5CF] bg-white px-3 py-2 text-xs focus:border-[#191919] focus:outline-none"
        >
          <option value="" disabled>Choose a class group</option>
          {classGroups.map((classGroup) => (
            <option key={classGroup.id} value={classGroup.id}>{classGroup.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="teacher-assignment-subject" className="mb-1 block text-[11px] font-semibold text-[#555555]">
          Subject
        </label>
        <select
          id="teacher-assignment-subject"
          name="subjectId"
          required
          defaultValue=""
          className="w-full rounded-[5px] border border-[#D5D5CF] bg-white px-3 py-2 text-xs focus:border-[#191919] focus:outline-none"
        >
          <option value="" disabled>Choose a subject</option>
          {subjects.map((subject) => (
            <option key={subject.id} value={subject.id}>{subject.name}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-[#777777]">
          Saving replaces the current teacher for this class group and subject.
        </p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-1.5 rounded-[5px] bg-[#191919] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#333333] disabled:opacity-50"
        >
          <UserRoundPlus className="h-4 w-4" />
          {isPending ? "Saving..." : "Assign Teacher"}
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