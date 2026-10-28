"use client";

import { useTransition } from "react";
import { removeTeacherAssignmentAction } from "@/app/academics/actions";
import { Trash2, Loader2, UserCheck } from "lucide-react";
import { TeacherAssignment } from "@/types/database";

interface Props {
  assignments: TeacherAssignment[];
}

export function ActiveTeacherAssignmentsList({ assignments }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleRemove = (assignmentId: string, teacherName: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to remove ${teacherName} from teaching ${subjectName}?`)) {
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("assignmentId", assignmentId);
      const res = await removeTeacherAssignmentAction(null, formData);
      if (res && "error" in res && res.error) {
        alert(res.error);
      }
    });
  };

  if (assignments.length === 0) return null;

  return (
    <div className="pt-3 border-t border-[#EEEEEC] space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777] flex items-center gap-1.5">
          <UserCheck className="w-3.5 h-3.5 text-[#2A7C13]" />
          <span>Active Subject Teacher Assignments ({assignments.length})</span>
        </div>
        <span className="text-[11px] text-[#888888]">
          Multiple teachers can be assigned to the same subject
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-72 overflow-y-auto pr-1">
        {assignments.map((ta) => {
          const teacherName = ta.teacher?.full_name || "Teacher";
          const subjectName = ta.subject?.name || "Subject";
          const streamName = ta.class_stream?.name || "Class Group";

          return (
            <div
              key={ta.id}
              className="p-3 rounded-[6px] border border-[#EAEAE6] bg-[#FAFAF8] flex items-start justify-between gap-2 text-xs shadow-2xs hover:border-[#D5D5CF] transition-colors"
            >
              <div className="space-y-1 min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[#191919] truncate">{streamName}</span>
                  <span className="px-1.5 py-0.2 rounded-[3px] bg-[#EAEAE6] text-[#555555] font-mono text-[10px] shrink-0">
                    {ta.subject?.code}
                  </span>
                </div>
                <div className="text-[11px] text-[#666666] truncate">{subjectName}</div>
                <div className="text-[11.5px] font-semibold text-[#1F5C0E] truncate">
                  👤 {teacherName}
                </div>
              </div>

              <button
                type="button"
                disabled={isPending}
                onClick={() => handleRemove(ta.id, teacherName, subjectName)}
                title={`Remove ${teacherName} from ${subjectName}`}
                className="p-1.5 rounded-[4px] text-[#888888] hover:text-red-600 hover:bg-red-50 transition-colors shrink-0 disabled:opacity-50 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
