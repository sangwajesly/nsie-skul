"use client";

import { useState, useActionState, useEffect } from "react";
import {
  Pencil,
  Trash2,
  X,
  Check,
  Loader2,
  AlertTriangle,
  SlidersHorizontal,
  Plus,
} from "lucide-react";
import {
  updateClassAction,
  deleteClassAction,
  updateClassStreamAction,
  deleteClassStreamAction,
} from "@/app/academics/actions";
import { ClassMasterSelectClient } from "./ClassMasterSelectClient";
import { ClassStreamCoefficientsModal } from "./ClassStreamCoefficientsModal";
import { ClassStreamCreateForm } from "./AcademicSetupForms";

interface TeacherOption {
  id: string;
  name: string;
  email: string;
}

interface SubjectOption {
  id: string;
  name: string;
  code: string;
  default_coefficient: number;
  default_max_marks: number;
}

interface ClassSubjectConfig {
  class_stream_id: string;
  subject_id: string;
  coefficient: number;
  max_marks: number;
}

interface StreamItem {
  id: string;
  name: string;
  class_master_id?: string | null;
  class_master?: { full_name?: string | null } | null;
}

interface ClassItem {
  id: string;
  name: string;
  level_order: number;
  cycle: string;
  streams: StreamItem[];
}

interface Props {
  cls: ClassItem;
  academicYearId: string;
  teachers: TeacherOption[];
  subjects: SubjectOption[];
  classSubjects: ClassSubjectConfig[];
  canManageAcademics: boolean;
  canManageAssignments: boolean;
}

function StreamRow({
  stream,
  className,
  teachers,
  subjects,
  classSubjects,
  canManageAcademics,
  canManageAssignments,
}: {
  stream: StreamItem;
  className: string;
  teachers: TeacherOption[];
  subjects: SubjectOption[];
  classSubjects: ClassSubjectConfig[];
  canManageAcademics: boolean;
  canManageAssignments: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const [updateState, updateFormAction, isUpdatePending] = useActionState(
    updateClassStreamAction,
    null
  );
  const [deleteState, deleteFormAction, isDeletePending] = useActionState(
    deleteClassStreamAction,
    null
  );

  useEffect(() => {
    if (updateState && "success" in updateState && updateState.success) {
      setIsEditing(false);
    }
  }, [updateState]);

  return (
    <div className="p-2.5 rounded-[4px] bg-white border border-[#E5E5DF] space-y-1.5 text-[11px]">
      {isEditing ? (
        <form action={updateFormAction} className="space-y-1.5">
          <input type="hidden" name="classStreamId" value={stream.id} />
          <div className="flex gap-1.5">
            <input
              type="text"
              name="name"
              defaultValue={stream.name}
              placeholder="Class group name (e.g. Form 1 Technical)"
              required
              className="flex-1 px-2 py-1 text-[11px] rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
            />
            <button
              type="submit"
              disabled={isUpdatePending}
              className="px-2 py-1 bg-[#191919] hover:bg-[#333333] text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
            >
              {isUpdatePending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              <span>Save</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              disabled={isUpdatePending}
              className="px-2 py-1 rounded text-[11px] text-[#666666] hover:bg-[#EAEAE6]"
            >
              Cancel
            </button>
          </div>
          {updateState && "error" in updateState && (
            <p className="text-[10px] text-red-600 font-medium">{updateState.error}</p>
          )}
        </form>
      ) : (
        <>
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-[#191919] truncate">{stream.name}</span>
            <div className="flex items-center gap-1 shrink-0">
              {stream.class_master?.full_name && (
                <span className="text-[10px] text-[#2A7C13] font-semibold bg-[#EAF7E4] px-1.5 py-0.5 rounded border border-[#76C457]/30 max-w-[120px] truncate">
                  {stream.class_master.full_name}
                </span>
              )}
              {canManageAcademics && (
                <>
                  <ClassStreamCoefficientsModal
                    streamId={stream.id}
                    streamName={stream.name}
                    subjects={subjects}
                    currentConfigs={classSubjects.filter((cs) => cs.class_stream_id === stream.id)}
                  />
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="p-1 rounded text-[#777777] hover:text-[#191919] hover:bg-[#EAEAE6] transition-colors"
                    title={`Rename ${stream.name}`}
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(true)}
                    className="p-1 rounded text-[#777777] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={`Delete ${stream.name}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>

          {isConfirmingDelete && (
            <div className="p-2 rounded bg-red-50 border border-red-200 text-[11px] text-red-900 space-y-1.5 animate-in fade-in">
              <div className="flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                <p className="font-semibold text-[10.5px]">
                  Delete &ldquo;{stream.name}&rdquo;?
                </p>
              </div>
              <p className="text-[10px] text-red-700 leading-tight">
                Protected: Cannot be deleted if students, marks, or attendance exist.
              </p>
              {deleteState && "error" in deleteState && (
                <p className="text-[10.5px] text-red-700 font-medium bg-red-100 p-1.5 rounded border border-red-200">
                  {deleteState.error}
                </p>
              )}
              <div className="flex items-center gap-1.5 pt-0.5">
                <form action={deleteFormAction}>
                  <input type="hidden" name="classStreamId" value={stream.id} />
                  <button
                    type="submit"
                    disabled={isDeletePending}
                    className="px-2 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[10px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                  >
                    {isDeletePending && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{isDeletePending ? "Removing..." : "Yes, Delete"}</span>
                  </button>
                </form>
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(false)}
                  disabled={isDeletePending}
                  className="px-2 py-0.5 rounded bg-white hover:bg-gray-100 text-[#555555] text-[10px] border border-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {canManageAssignments ? (
            <ClassMasterSelectClient
              classStreamId={stream.id}
              streamName={stream.name}
              currentClassMasterId={stream.class_master_id}
              teachers={teachers}
            />
          ) : (
            <div className="text-[10px] text-[#777777]">
              Class master: {stream.class_master?.full_name || "Not assigned"}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export function ClassCardItem({
  cls,
  academicYearId,
  teachers,
  subjects,
  classSubjects,
  canManageAcademics,
  canManageAssignments,
}: Props) {
  const [isEditingClass, setIsEditingClass] = useState(false);
  const [isConfirmingDeleteClass, setIsConfirmingDeleteClass] = useState(false);
  const [showAddStream, setShowAddStream] = useState(false);

  const [updateClassState, updateClassFormAction, isUpdateClassPending] = useActionState(
    updateClassAction,
    null
  );
  const [deleteClassState, deleteClassFormAction, isDeleteClassPending] = useActionState(
    deleteClassAction,
    null
  );

  useEffect(() => {
    if (updateClassState && "success" in updateClassState && updateClassState.success) {
      setIsEditingClass(false);
    }
  }, [updateClassState]);

  return (
    <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-[#FAFAF8] space-y-2.5 flex flex-col justify-between">
      <div className="space-y-2.5">
        {/* Class Header */}
        {isEditingClass ? (
          <form action={updateClassFormAction} className="space-y-2 p-2 rounded bg-white border border-[#D5D5CF] text-xs">
            <input type="hidden" name="classId" value={cls.id} />
            <div className="space-y-1.5">
              <input
                type="text"
                name="name"
                defaultValue={cls.name}
                placeholder="Class name"
                required
                className="w-full px-2.5 py-1 text-xs rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
              />
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="number"
                  name="levelOrder"
                  defaultValue={cls.level_order}
                  min="1"
                  max="12"
                  required
                  placeholder="Order (1-12)"
                  className="px-2 py-1 text-xs font-mono rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                />
                <select
                  name="cycle"
                  defaultValue={cls.cycle}
                  className="px-2 py-1 text-xs rounded border border-[#D5D5CF] bg-white focus:outline-none focus:border-[#191919]"
                >
                  <option value="cycle_1">O-Level (Cycle 1)</option>
                  <option value="cycle_2">A-Level (Cycle 2)</option>
                </select>
              </div>
            </div>
            {updateClassState && "error" in updateClassState && (
              <p className="text-[11px] text-red-600 font-medium">{updateClassState.error}</p>
            )}
            <div className="flex items-center justify-end gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setIsEditingClass(false)}
                disabled={isUpdateClassPending}
                className="px-2 py-1 rounded text-[11px] text-[#666666] hover:bg-[#EAEAE6]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdateClassPending}
                className="inline-flex items-center gap-1 px-3 py-1 bg-[#191919] hover:bg-[#333333] text-white rounded text-[11px] font-semibold transition-colors disabled:opacity-50"
              >
                {isUpdateClassPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : (
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-[13px] text-[#191919]">{cls.name}</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-[4px] bg-[#EAEAE6] text-[#555555]">
                  {cls.cycle === "cycle_1" ? "O-Level" : "A-Level"}
                </span>
              </div>

              {canManageAcademics && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsEditingClass(true)}
                    className="p-1 rounded text-[#777777] hover:text-[#191919] hover:bg-[#EAEAE6] transition-colors"
                    title={`Edit ${cls.name}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDeleteClass(true)}
                    className="p-1 rounded text-[#777777] hover:text-red-600 hover:bg-red-50 transition-colors"
                    title={`Delete ${cls.name}`}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {isConfirmingDeleteClass && (
              <div className="mt-2 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-900 space-y-1.5 animate-in fade-in">
                <div className="flex items-start gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0 mt-0.5" />
                  <p className="font-semibold text-[11px]">
                    Delete class &ldquo;{cls.name}&rdquo;?
                  </p>
                </div>
                {cls.streams.length > 0 ? (
                  <p className="text-[11px] text-red-700">
                    Cannot delete this class while it contains {cls.streams.length} class group(s). Delete or reassign the groups below first.
                  </p>
                ) : (
                  <p className="text-[10.5px] text-red-700">
                    This class level has 0 groups and can be safely removed.
                  </p>
                )}
                {deleteClassState && "error" in deleteClassState && (
                  <p className="text-[11px] text-red-700 font-medium bg-red-100 p-1.5 rounded">
                    {deleteClassState.error}
                  </p>
                )}
                <div className="flex items-center gap-2 pt-0.5">
                  {cls.streams.length === 0 && (
                    <form action={deleteClassFormAction}>
                      <input type="hidden" name="classId" value={cls.id} />
                      <button
                        type="submit"
                        disabled={isDeleteClassPending}
                        className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white text-[11px] font-semibold transition-colors disabled:opacity-50 inline-flex items-center gap-1"
                      >
                        {isDeleteClassPending && <Loader2 className="w-3 h-3 animate-spin" />}
                        <span>{isDeleteClassPending ? "Deleting..." : "Yes, Delete Class"}</span>
                      </button>
                    </form>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDeleteClass(false)}
                    disabled={isDeleteClassPending}
                    className="px-2 py-0.5 rounded bg-white hover:bg-gray-100 text-[#555555] text-[11px] border border-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Streams List */}
        <div className="space-y-1">
          {cls.streams.length === 0 ? (
            <div className="text-[11px] italic text-[#888888] py-1">No class groups added yet</div>
          ) : (
            cls.streams.map((st) => (
              <StreamRow
                key={st.id}
                stream={st}
                className={cls.name}
                teachers={teachers}
                subjects={subjects}
                classSubjects={classSubjects}
                canManageAcademics={canManageAcademics}
                canManageAssignments={canManageAssignments}
              />
            ))
          )}
        </div>
      </div>

      {/* Add Class Group Form (Collapsible) */}
      {canManageAcademics && (
        <div className="pt-2 border-t border-[#EEEEEC]">
          {showAddStream ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] text-[#555555]">
                <span className="font-semibold">New group in {cls.name}</span>
                <button
                  type="button"
                  onClick={() => setShowAddStream(false)}
                  className="text-[#888888] hover:text-[#191919] p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <ClassStreamCreateForm
                classId={cls.id}
                className={cls.name}
                academicYearId={academicYearId}
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddStream(true)}
              className="w-full py-1.5 px-2 text-[11px] font-semibold text-[#555555] hover:text-[#191919] hover:bg-[#EAEAE6] rounded-[4px] border border-dashed border-[#D5D5CF] transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Add Class Group</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
