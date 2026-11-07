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
  Pencil,
  Scale,
  Check,
  Loader2,
  AlertCircle,
  School,
} from "lucide-react";
import { DepartmentListItem } from "./DepartmentListItem";
import { DepartmentCreateForm, SubjectCreateForm } from "./AcademicSetupForms";
import HodAssignmentForm from "./HodAssignmentForm";
import {
  deleteSubjectAction,
  updateSubjectAction,
  assignSubjectToDepartmentAction,
} from "@/app/academics/actions";

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

  // Subject deletion state
  const [subjectToDelete, setSubjectToDelete] = useState<SubjectItem | null>(null);
  const [deleteConfirmMarks, setDeleteConfirmMarks] = useState(false);

  // Subject editing state (for master catalog table)
  const [subjectToEdit, setSubjectToEdit] = useState<SubjectItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [editDeptId, setEditDeptId] = useState("");
  const [editCoef, setEditCoef] = useState("2");
  const [editMaxMarks, setEditMaxMarks] = useState("20");

  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleOpenEditCatalog = (sub: SubjectItem) => {
    setSubjectToEdit(sub);
    setEditName(sub.name);
    setEditCode(sub.code);
    setEditDeptId(sub.department_id || "");
    setEditCoef(String(sub.default_coefficient || 2));
    setEditMaxMarks(String(sub.default_max_marks || 20));
    setFeedback(null);
  };

  const handleUpdateCatalogSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectToEdit || !editName.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("subjectId", subjectToEdit.id);
      fd.set("name", editName.trim());
      if (editCode.trim()) {
        fd.set("code", editCode.trim().toUpperCase());
      }
      if (editDeptId) {
        fd.set("departmentId", editDeptId);
      }
      fd.set("defaultCoefficient", editCoef);
      fd.set("defaultMaxMarks", editMaxMarks);

      const res = await updateSubjectAction(null, fd);
      if (res && "error" in res && res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        setFeedback({
          type: "success",
          text: `Subject "${editName.trim()}" updated successfully.`,
        });
        setSubjectToEdit(null);
      }
    });
  };

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

  const handleAssignSubject = (subjectId: string, targetDeptId: string) => {
    setFeedback(null);
    startTransition(async () => {
      const res = await assignSubjectToDepartmentAction(subjectId, targetDeptId);
      if (res && "error" in res && res.error) {
        setFeedback({ type: "error", text: res.error });
      } else {
        const sub = subjects.find((s) => s.id === subjectId);
        const dept = departments.find((d) => d.id === targetDeptId);
        setFeedback({
          type: "success",
          text: `Subject "${sub?.name || "Subject"}" assigned to ${dept?.name || "department"}.`,
        });
      }
    });
  };

  // Unassigned subjects (created without a department)
  const unassignedSubjects = useMemo(() => {
    return subjects.filter((s) => !s.department_id);
  }, [subjects]);

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
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-[8px] border border-[#E5E5DF] bg-white shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] text-[#2A7C13] flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
              Academic Departments
            </div>
            <div className="text-xl font-bold text-[#142010] mt-0.5">
              {departments.length}
            </div>
            <p className="text-[10px] text-[#525E4B]">Arts, Sciences &amp; Technical</p>
          </div>
        </div>

        <div className="p-3.5 rounded-[8px] border border-[#E5E5DF] bg-white shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] text-amber-700 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
              Subjects Catalog
            </div>
            <div className="text-xl font-bold text-[#142010] mt-0.5">
              {subjects.length}
            </div>
            <p className="text-[10px] text-[#525E4B]">With syllabus weightings</p>
          </div>
        </div>

        <div className="p-3.5 rounded-[8px] border border-[#E5E5DF] bg-white shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-[6px] bg-[#FAF8F2] border border-[#E8DFC9] text-[#2A7C13] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#777777]">
              Department Heads Assigned
            </div>
            <div className="text-xl font-bold text-[#142010] mt-0.5">
              {hodAssignments.length}
            </div>
            <p className="text-[10px] text-[#525E4B]">Departmental supervisors</p>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-2.5 rounded-[6px] text-xs flex items-center justify-between gap-2 border ${
            feedback.type === "success"
              ? "bg-[#F0FDF4] text-[#166534] border-[#BBF7D0]"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-[#2A7C13] shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span className="font-semibold">{feedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-stone-400 hover:text-stone-700 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Control Bar: Sub-Tabs & Action Triggers */}
      <div className="bg-white p-3.5 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Sub-Tab Navigation */}
          <div className="inline-flex rounded-[5px] border border-[#D5D5CF] bg-[#FAFAF8] p-0.5 text-xs gap-0.5 self-start">
            <button
              type="button"
              onClick={() => {
                setSubTab("departments");
                setSearchTerm("");
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors cursor-pointer ${
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
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-[4px] text-[11px] font-semibold transition-colors cursor-pointer ${
                subTab === "subjects"
                  ? "bg-white text-[#191919] shadow-2xs font-bold"
                  : "text-[#666666] hover:text-[#191919]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Subjects Catalog ({subjects.length})</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canManageAcademics && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddDeptForm((p) => !p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#191919] transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#2A7C13]" />
                  <span>{showAddDeptForm ? "Close Dept Form" : "Add Department"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddSubjectForm((p) => !p)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#191919] transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3 h-3 text-[#2A7C13]" />
                  <span>{showAddSubjectForm ? "Close Subject Form" : "Add Subject"}</span>
                </button>
              </>
            )}

            {canManageSettings && (
              <button
                type="button"
                onClick={() => setShowAssignHodForm((p) => !p)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold rounded-[4px] border border-[#D5D5CF] bg-white hover:bg-[#FAFAF8] text-[#1F5C0E] transition-colors shadow-2xs cursor-pointer"
              >
                <Award className="w-3 h-3" />
                <span>{showAssignHodForm ? "Close HOD Form" : "Assign HOD"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2.5 border-t border-[#EEEEEC]">
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
              className="w-full pl-9 pr-7 py-1.5 text-xs rounded-[5px] border border-[#D5D5CF] bg-white text-[#191919] focus:outline-none focus:border-[#191919]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#888888] hover:text-[#191919] cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {subTab === "subjects" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-semibold text-[#777777] flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#2A7C13]" /> Dept:
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

      {/* Setup Forms Drawers */}
      {showAddDeptForm && canManageAcademics && (
        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEC]">
            <span className="text-xs font-bold text-[#191919]">Create New Department</span>
            <button
              type="button"
              onClick={() => setShowAddDeptForm(false)}
              className="text-[#888888] hover:text-[#191919] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <DepartmentCreateForm unassignedSubjects={unassignedSubjects} />
        </div>
      )}

      {showAddSubjectForm && canManageAcademics && (
        <div className="bg-white p-4 rounded-[8px] border border-[#E5E5DF] shadow-2xs space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-[#EEEEEC]">
            <span className="text-xs font-bold text-[#191919]">Add Subject to Catalog</span>
            <button
              type="button"
              onClick={() => setShowAddSubjectForm(false)}
              className="text-[#888888] hover:text-[#191919] cursor-pointer"
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
              className="text-[#888888] hover:text-[#191919] cursor-pointer"
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

      {/* --- SUB-TAB 1: DEPARTMENTS & HEADS LIST --- */}
      {subTab === "departments" && (
        <div className="space-y-3">
          {filteredDepartments.length === 0 ? (
            <div className="bg-white rounded-[8px] border border-[#E5E5DF] p-12 text-center space-y-2">
              <Building2 className="w-8 h-8 text-[#888888] mx-auto" />
              <h4 className="text-sm font-bold text-[#191919]">No Departments Found</h4>
              <p className="text-xs text-[#666666] max-w-sm mx-auto">
                {searchTerm
                  ? "No departments match your search query."
                  : "No departments have been configured yet."}
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
                    unassignedSubjects={unassignedSubjects}
                    hodName={assignedHod?.hod_user?.full_name || null}
                    canManage={canManageAcademics}
                  />
                );
              })}
            </div>
          )}

          {/* Unassigned Subjects Section (Discoverable in Departments view) */}
          {unassignedSubjects.length > 0 && (
            <div className="rounded-[8px] border border-amber-200 bg-[#FFFDF5] p-4 shadow-2xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <BookOpen className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#142010]">
                      Unassigned Subjects ({unassignedSubjects.length})
                    </h4>
                    <p className="text-[11px] text-[#788470]">
                      These subjects were created without an assigned department. You can assign them to any department below.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {unassignedSubjects.map((sub) => (
                  <div
                    key={sub.id}
                    className="p-3 rounded-[6px] bg-white border border-[#E5E5DF] space-y-2 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#142010] truncate">
                        {sub.name}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#F0EFEA] text-[#555555]">
                        {sub.code}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#788470]">
                      <span>Coef {sub.default_coefficient}</span>
                      <span>Max {sub.default_max_marks}</span>
                    </div>

                    {canManageAcademics && departments.length > 0 && (
                      <div className="pt-1.5 border-t border-[#F1F1ED]">
                        <select
                          defaultValue=""
                          disabled={isPending}
                          onChange={(e) => {
                            const targetDeptId = e.target.value;
                            if (targetDeptId) {
                              handleAssignSubject(sub.id, targetDeptId);
                            }
                          }}
                          className="w-full text-[11px] px-2 py-1.5 rounded border border-[#D5D5CF] bg-[#FAFAF8] text-[#142010] focus:outline-none cursor-pointer"
                        >
                          <option value="">Assign to Department...</option>
                          {departments.map((d) => (
                            <option key={d.id} value={d.id}>
                              {d.name} ({d.code})
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SUB-TAB 2: MASTER SUBJECTS CATALOG TABLE --- */}
      {subTab === "subjects" && (
        <div className="bg-white rounded-[8px] border border-[#E5E5DF] overflow-hidden shadow-2xs">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5E5DF] bg-[#FAFAF8] text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                    <th className="py-2.5 px-3">Code</th>
                    <th className="py-2.5 px-3">Subject Name</th>
                    <th className="py-2.5 px-3">Department</th>
                    <th className="py-2.5 px-3 text-center">Coefficient (Weight)</th>
                    <th className="py-2.5 px-3 text-center">Max Mark</th>
                    {canManageAcademics && <th className="py-2.5 px-3 text-center w-20">Actions</th>}
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
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCatalog(sub)}
                              disabled={isPending}
                              className="p-1 rounded text-stone-500 hover:text-[#191919] hover:bg-[#EAEAE6] transition-colors cursor-pointer"
                              title={`Edit ${sub.name}`}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
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
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Edit Subject Modal Dialog (Catalog) */}
      {subjectToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[8px] border border-[#E5E5DF] shadow-xl w-full max-w-md p-5 space-y-3.5">
            <div className="flex items-center justify-between border-b border-stone-100 pb-2">
              <div className="flex items-center gap-2">
                <Pencil className="w-4 h-4 text-[#2A7C13]" />
                <h4 className="text-sm font-bold text-[#142010]">
                  Edit Subject: {subjectToEdit.name}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSubjectToEdit(null)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateCatalogSubject} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Department
                </label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                >
                  <option value="">General / No Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Code <span className="text-[10px] text-[#788470] font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    placeholder="Optional"
                    className="w-full px-2.5 py-1.5 text-center font-mono font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white uppercase focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Coefficient
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="20"
                    required
                    value={editCoef}
                    onChange={(e) => setEditCoef(e.target.value)}
                    className="w-full px-2 py-1.5 text-center font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Max Mark
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    required
                    value={editMaxMarks}
                    onChange={(e) => setEditMaxMarks(e.target.value)}
                    className="w-full px-2 py-1.5 text-center font-bold text-xs rounded-[5px] border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSubjectToEdit(null)}
                  disabled={isPending}
                  className="px-3 py-1 rounded-[4px] text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-4 py-1.5 rounded-[5px] bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                >
                  {isPending ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{isPending ? "Updating..." : "Save Changes"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Subject from Catalog Confirmation Modal */}
      {subjectToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-[8px] border border-red-200 shadow-xl w-full max-w-md p-5 space-y-3">
            <div className="flex items-start gap-2.5 text-red-700">
              <div className="p-2 rounded-full bg-red-100 shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-red-900">
                  Delete &ldquo;{subjectToDelete.name}&rdquo; from catalog?
                </h4>
                <p className="text-xs text-red-700">
                  Code: <strong>{subjectToDelete.code}</strong> · Department:{" "}
                  <strong>{subjectToDelete.department?.name || "General"}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#525E4B] leading-relaxed bg-[#FAF8F2] p-2.5 rounded-[6px] border border-[#E8DFC9]">
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
                className="px-3.5 py-1.5 rounded-[4px] border border-[#D5CBB2] text-xs font-semibold text-[#525E4B] hover:bg-[#FAF8F2] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCatalogSubject(deleteConfirmMarks)}
                disabled={isPending}
                className="px-4 py-1.5 rounded-[4px] bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
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

export default DepartmentsSubjectsManager;
