"use client";

import { useState, useMemo, useTransition } from "react";
import {
  Building2,
  BookOpen,
  Plus,
  Search,
  Award,
  ChevronDown,
  ChevronUp,
  X,
  Filter,
  Users,
  Trash2,
} from "lucide-react";
import { DepartmentListItem } from "./DepartmentListItem";
import { DepartmentCreateForm, SubjectCreateForm } from "./AcademicSetupForms";
import HodAssignmentForm from "./HodAssignmentForm";
import { deleteSubjectAction } from "@/app/academics/actions";

interface DepartmentItem {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  subjects?: unknown[];
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  department_id?: string | null;
  default_coefficient: number;
  default_max_marks: number;
  department?: { id: string; name: string } | null;
}

interface HodAssignmentItem {
  id: string;
  department_id?: string | null;
  scope_type: string;
  hod_user?: { full_name?: string | null };
}

interface Props {
  academicYearId: string;
  departments: DepartmentItem[];
  subjects: SubjectItem[];
  hodAssignments: HodAssignmentItem[];
  headsOfDepartment: Array<{ id: string; name: string; email: string }>;
  canManageAcademics: boolean;
  canManageSettings: boolean;
}

export function DepartmentsSubjectsManager({
  academicYearId,
  departments,
  subjects,
  hodAssignments,
  headsOfDepartment,
  canManageAcademics,
  canManageSettings,
}: Props) {
  const [subTab, setSubTab] = useState<"departments" | "subjects">("departments");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState("");
  const [showAddDeptForm, setShowAddDeptForm] = useState(false);
  const [showAddSubjectForm, setShowAddSubjectForm] = useState(false);
  const [showAssignHodForm, setShowAssignHodForm] = useState(false);
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [deleteConfirmMarks, setDeleteConfirmMarks] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleDeleteCatalogSubject = (confirmMarks = false) => {
    if (!subjectToDelete) return;
    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("subjectId", subjectToDelete.id);
      if (confirmMarks) {
        fd.set("confirmDeleteMarks", "true");
      }
      const res = await deleteSubjectAction(null, fd);
      if (res && "error" in res && res.error) {
        if ("needsConfirmation" in res && res.needsConfirmation) {
          setDeleteConfirmMarks(true);
        } else {
          setFeedback({ type: "error", text: res.error });
          setSubjectToDelete(null);
          setDeleteConfirmMarks(false);
        }
      } else {
        setFeedback({
          type: "success",
          text: `Subject "${subjectToDelete.name}" removed from school catalog.`,
        });
        setSubjectToDelete(null);
        setDeleteConfirmMarks(false);
      }
    });
  };

  // Filtered Departments
  const filteredDepartments = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return departments;
    return departments.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        (d.description || "").toLowerCase().includes(q)
    );
  }, [departments, searchTerm]);

  // Filtered Subjects
  const filteredSubjects = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    return subjects.filter((s) => {
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.department?.name || "").toLowerCase().includes(q);

      const matchesDept =
        !selectedDeptFilter || s.department_id === selectedDeptFilter;

      return matchesSearch && matchesDept;
    });
  }, [subjects, searchTerm, selectedDeptFilter]);

  return (
    <div className="space-y-4">
      {/* Overview Statistics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Academic Departments
          </div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">
            {departments.length}
          </div>
          <p className="text-[10px] text-[#888888] mt-0.5">
            General, Technical &amp; Commercial
          </p>
        </div>
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Subjects Catalog
          </div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">
            {subjects.length}
          </div>
          <p className="text-[10px] text-[#888888] mt-0.5">With syllabus coefficients</p>
        </div>
        <div className="p-3.5 rounded-[6px] border border-[#E5E5DF] bg-white col-span-2 sm:col-span-1">
          <div className="text-[11px] font-bold uppercase tracking-wider text-[#777777]">
            Department Heads Assigned
          </div>
          <div className="text-xl font-extrabold text-[#191919] mt-0.5">
            {hodAssignments.length}
          </div>
          <p className="text-[10px] text-[#888888] mt-0.5">Departmental supervisors</p>
        </div>
      </div>

      {/* Control Bar: Sub-Tabs & Actions */}
      <div className="bg-white p-3.5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sub-Tab Navigation */}
          <div className="inline-flex rounded-[5px] border border-[#D5D5CF] bg-[#FAFAF8] p-0.5 text-xs">
            <button
              type="button"
              onClick={() => {
                setSubTab("departments");
                setSearchTerm("");
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                subTab === "departments"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Departments &amp; Heads ({departments.length})</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab("subjects");
                setSearchTerm("");
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors ${
                subTab === "subjects"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Subjects Catalog ({subjects.length})</span>
            </button>
          </div>

          {/* Action Triggers */}
          <div className="flex items-center gap-2 flex-wrap">
            {canManageAcademics && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddDeptForm((p) => !p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#191919] transition-colors shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddDeptForm ? "Close Dept Form" : "Add Department"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddSubjectForm((p) => !p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#191919] transition-colors shadow-2xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>{showAddSubjectForm ? "Close Subject Form" : "Add Subject"}</span>
                </button>
              </>
            )}

            {canManageSettings && (
              <button
                type="button"
                onClick={() => setShowAssignHodForm((p) => !p)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#1F5C0E] transition-colors shadow-2xs"
              >
                <Award className="w-3 h-3" />
                <span>{showAssignHodForm ? "Close HOD Form" : "Assign HOD"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Secondary Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-[#EEEEEC]">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                subTab === "departments"
                  ? "Search departments by name or code..."
                  : "Search subjects by name, code, or department..."
              }
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-[5px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#191919]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#191919]"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {subTab === "subjects" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-[#777777] flex items-center gap-1">
                <Filter className="w-3 h-3" /> Dept:
              </span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-2 py-1 text-[11px] rounded-[4px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none"
              >
                <option value="">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.code})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Collapsible Drawers */}
      {showAddDeptForm && canManageAcademics && (
        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEC]">
            <span className="text-xs font-bold text-[#191919]">Create New Department</span>
            <button
              type="button"
              onClick={() => setShowAddDeptForm(false)}
              className="text-[#888888] hover:text-[#191919]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <DepartmentCreateForm />
        </div>
      )}

      {showAddSubjectForm && canManageAcademics && (
        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEC]">
            <span className="text-xs font-bold text-[#191919]">Add Subject to Catalog</span>
            <button
              type="button"
              onClick={() => setShowAddSubjectForm(false)}
              className="text-[#888888] hover:text-[#191919]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <SubjectCreateForm departments={departments.map(({ id, name }) => ({ id, name }))} />
        </div>
      )}

      {showAssignHodForm && canManageSettings && (
        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEC]">
            <span className="text-xs font-bold text-[#191919]">Assign Head of Department</span>
            <button
              type="button"
              onClick={() => setShowAssignHodForm(false)}
              className="text-[#888888] hover:text-[#191919]"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <HodAssignmentForm
            academicYearId={academicYearId}
            departments={departments.map(({ id, name }) => ({ id, name }))}
            headsOfDepartment={headsOfDepartment}
          />
        </div>
      )}

      {/* --- SUB-TAB 1: DEPARTMENTS & HEADS --- */}
      {subTab === "departments" && (
        <div className="space-y-3">
          {filteredDepartments.length === 0 ? (
            <div className="bg-white rounded-[8px] border border-[#E5E5DF] p-12 text-center space-y-2">
              <Building2 className="w-8 h-8 text-[#888888] mx-auto" />
              <h4 className="text-sm font-bold text-[#191919]">No Departments Found</h4>
              <p className="text-xs text-[#666666] max-w-sm mx-auto">
                {searchTerm
                  ? "No departments match your search query."
                  : "No departments have been configured yet (e.g. Science, Arts, Commercial, Technical)."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredDepartments.map((dept) => {
                const assignedHod = hodAssignments.find(
                  (a) => a.department_id === dept.id && a.scope_type === "department"
                );
                const deptSubjects = subjects.filter((s) => s.department_id === dept.id);
                return (
                  <DepartmentListItem
                    key={dept.id}
                    dept={dept}
                    subjects={deptSubjects}
                    hodName={assignedHod?.hod_user?.full_name || null}
                    canManage={canManageAcademics}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 2: SUBJECTS CATALOG --- */}
      {subTab === "subjects" && (
        <div className="bg-white rounded-[8px] border border-[#E5E5DF] overflow-x-auto shadow-2xs">
          {filteredSubjects.length === 0 ? (
            <div className="p-12 text-center space-y-2">
              <BookOpen className="w-8 h-8 text-[#888888] mx-auto" />
              <h4 className="text-sm font-bold text-[#191919]">No Subjects Found</h4>
              <p className="text-xs text-[#666666] max-w-sm mx-auto">
                {searchTerm || selectedDeptFilter
                  ? "No subjects match your search or department filter."
                  : "No subjects registered in the catalog yet."}
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#E5E5DF] bg-[#FAFAF8] text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                  <th className="py-2.5 px-3">Code</th>
                  <th className="py-2.5 px-3">Subject Name</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">Coefficient (Weight)</th>
                  <th className="py-2.5 px-3 text-center">Max Mark</th>
                  {canManageAcademics && <th className="py-2.5 px-3 text-center w-16">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F1ED] text-[#191919]">
                {filteredSubjects.map((sub) => (
                  <tr key={sub.id} className="hover:bg-[#FAFAF8] transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#191919]">
                      <span className="px-1.5 py-0.5 rounded-[3px] bg-[#EAEAE6] text-[#555555]">
                        {sub.code}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-[#191919]">
                      {sub.name}
                    </td>
                    <td className="py-2.5 px-3 text-[#555555]">
                      {sub.department?.name || "General"}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#191919]">
                      {sub.default_coefficient}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold text-[#191919]">
                      /{sub.default_max_marks}
                    </td>
                    {canManageAcademics && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSubjectToDelete(sub);
                            setDeleteConfirmMarks(false);
                          }}
                          disabled={isPending}
                          className="p-1 rounded text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                          title={`Delete ${sub.name} from catalog`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Delete Subject from Catalog Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-[10px] border border-red-200 shadow-2xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-start gap-2.5 text-red-700">
              <div className="p-2 rounded-full bg-red-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-red-900">
                  Delete &ldquo;{subjectToDelete.name}&rdquo; from school?
                </h4>
                <p className="text-[11px] text-red-700">
                  Code: <strong>{subjectToDelete.code}</strong> · Department:{" "}
                  <strong>{subjectToDelete.department?.name || "General"}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#525E4B] leading-relaxed">
              {deleteConfirmMarks
                ? "Assessment marks exist for this subject. Confirming will delete all recorded marks and permanently delete the subject from the school catalog."
                : "This subject will be permanently removed from the school catalog, class curricula, and report cards."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F0EFEA]">
              <button
                type="button"
                onClick={() => {
                  setSubjectToDelete(null);
                  setDeleteConfirmMarks(false);
                }}
                className="px-3.5 py-1.5 rounded-[5px] border border-[#D5CBB2] text-xs font-semibold text-[#525E4B] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCatalogSubject(deleteConfirmMarks)}
                disabled={isPending}
                className="px-4 py-1.5 rounded-[5px] bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                {isPending ? "Deleting..." : deleteConfirmMarks ? "Delete Marks & Subject" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
