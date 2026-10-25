"use client";

import { useState, useActionState, useEffect } from "react";
import { Award, Pencil, Trash2, X, Check, Loader2 } from "lucide-react";
import { updateDepartmentAction, deleteDepartmentAction } from "@/app/academics/actions";

interface Props {
  dept: {
    id: string;
    name: string;
    code: string;
    description?: string | null;
    subjects?: unknown[];
  };
  hodName?: string | null;
  canManage: boolean;
}

export function DepartmentListItem({ dept, hodName, canManage }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateDepartmentAction,
    null
  );
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteDepartmentAction,
    null
  );

  useEffect(() => {
    if (updateState && "success" in updateState && updateState.success) {
      setIsEditing(false);
    }
  }, [updateState]);

  return (
    <div className="p-3 rounded-[6px] border border-[#EAEAE6] bg-[#FAFAF8] space-y-2">
      {isEditing ? (
        <form action={updateFormAction} className="space-y-2 text-[12px]">
          <input type="hidden" name="departmentId" value={dept.id} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              name="name"
              defaultValue={dept.name}
              placeholder="Department Name"
              required
              className="sm:col-span-2 px-2.5 py-1 text-xs rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
            />
            <input
              type="text"
              name="code"
              defaultValue={dept.code}
              placeholder="Code"
              required
              className="px-2.5 py-1 text-xs uppercase font-mono rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
            />
          </div>
          {updateState && "error" in updateState && (
            <p className="text-[11px] text-red-600 font-medium">{updateState.error}</p>
          )}
          <div className="flex items-center justify-end gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isUpdatePending}
              className="px-2.5 py-1 rounded text-[11px] text-[#666666] hover:bg-[#EAEAE6] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUpdatePending}
              className="inline-flex items-center gap-1 px-3 py-1 bg-[#191919] hover:bg-[#333333] text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
            >
              {isUpdatePending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Check className="w-3 h-3" />
              )}
              <span>{isUpdatePending ? "Saving..." : "Save"}</span>
            </button>
          </div>
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[13px] text-[#191919]">{dept.name}</span>
              <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEAE6] text-[#555555] text-[10px] font-mono font-bold">
                {dept.code}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] text-[#888888]">
                {dept.subjects?.length || 0} subjects
              </span>
              {canManage && (
                <div className="flex items-center gap-1 pl-1">
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded text-[#777777] hover:text-[#191919] hover:bg-[#EAEAE6] transition-colors"
                    title="Edit department"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="p-1 rounded text-[#777777] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title="Remove department"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {isConfirmingDelete && (
            <div className="p-2 rounded bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5">
              <p className="font-semibold text-[11px]">
                Remove department &ldquo;{dept.name}&rdquo;?
              </p>
              {deleteState && "error" in deleteState && (
                <p className="text-[11px] text-red-700">{deleteState.error}</p>
              )}
              <div className="flex items-center gap-2">
                <form action={deleteFormAction}>
                  <input type="hidden" name="departmentId" value={dept.id} />
                  <button
                    type="submit"
                    disabled={isDeletePending}
                    className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {isDeletePending && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{isDeletePending ? "Removing..." : "Yes, Remove"}</span>
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeletePending}
                  className="px-2 py-0.5 rounded bg-white hover:bg-gray-100 text-[#555555] text-[11px] border border-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-1 border-t border-[#EBEBE8] text-[11px] text-[#666666]">
            <Award className="w-3.5 h-3.5 text-[#C2410C]" />
            <span>
              Head of Department:{" "}
              {hodName ? (
                <strong className="text-[#191919]">{hodName}</strong>
              ) : (
                <span className="italic text-[#888888]">Unassigned</span>
              )}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
