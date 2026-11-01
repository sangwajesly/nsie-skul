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
import { deleteSubjectAction, updateSubjectAction } from "@/app/academics/actions";

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
    if (!subjectToEdit || !editName.trim() || !editCode.trim()) return;

    setFeedback(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.set("subjectId", subjectToEdit.id);
      fd.set("name", editName.trim());
      fd.set("code", editCode.trim().toUpperCase());
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
        <div className="p-4 rounded-2xl border border-stone-200/90 bg-white shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#2A7C13] border border-emerald-200/60 flex items-center justify-center shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#788470]">
              Academic Departments
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#142010] mt-0.5">
              {departments.length}
            </div>
            <p className="text-[11px] text-[#525E4B]">General, Arts, Sciences &amp; Technical</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-stone-200/90 bg-white shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200/60 flex items-center justify-center shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#788470]">
              Subjects Catalog
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#142010] mt-0.5">
              {subjects.length}
            </div>
            <p className="text-[11px] text-[#525E4B]">Assigned syllabus weightings</p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-stone-200/90 bg-white shadow-2xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200/60 flex items-center justify-center shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-[#788470]">
              Department Heads Assigned
            </div>
            <div className="text-xl sm:text-2xl font-black text-[#142010] mt-0.5">
              {hodAssignments.length}
            </div>
            <p className="text-[11px] text-[#525E4B]">Supervisors with pedagogical oversight</p>
          </div>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border animate-in fade-in ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-900 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <Check className="w-4 h-4 text-emerald-700 shrink-0" />
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
      <div className="bg-white p-4 rounded-2xl border border-stone-200/90 shadow-2xs space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Segmented Sub-Tab Switcher */}
          <div className="inline-flex rounded-xl bg-[#FAF8F2] p-1 text-xs border border-[#E8DFC9] gap-1 self-start">
            <button
              type="button"
              onClick={() => {
                setSubTab("departments");
                setSearchTerm("");
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subTab === "departments"
                  ? "bg-white text-[#142010] shadow-2xs font-extrabold"
                  : "text-[#525E4B] hover:text-[#142010]"
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-[#2A7C13]" />
              <span>Departments &amp; Heads</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-200/70 text-stone-700 text-[10px]">
                {departments.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSubTab("subjects");
                setSearchTerm("");
              }}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                subTab === "subjects"
                  ? "bg-white text-[#142010] shadow-2xs font-extrabold"
                  : "text-[#525E4B] hover:text-[#142010]"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span>Subjects Catalog</span>
              <span className="px-1.5 py-0.2 rounded-full bg-stone-200/70 text-stone-700 text-[10px]">
                {subjects.length}
              </span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {canManageAcademics && (
              <>
                <button
                  type="button"
                  onClick={() => setShowAddDeptForm((p) => !p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    showAddDeptForm
                      ? "bg-stone-200 text-stone-800 border-stone-300"
                      : "bg-[#FAF8F2] text-[#142010] border-[#D5CBB2] hover:bg-[#F3EFE3]"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-[#2A7C13]" />
                  <span>{showAddDeptForm ? "Close Form" : "New Department"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddSubjectForm((p) => !p)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                    showAddSubjectForm
                      ? "bg-stone-200 text-stone-800 border-stone-300"
                      : "bg-[#FAF8F2] text-[#142010] border-[#D5CBB2] hover:bg-[#F3EFE3]"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5 text-[#2A7C13]" />
                  <span>{showAddSubjectForm ? "Close Form" : "New Master Subject"}</span>
                </button>
              </>
            )}

            {canManageSettings && (
              <button
                type="button"
                onClick={() => setShowAssignHodForm((p) => !p)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  showAssignHodForm
                    ? "bg-amber-100 text-amber-900 border-amber-300"
                    : "bg-emerald-50 text-[#2A7C13] border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>{showAssignHodForm ? "Close HOD" : "Assign HOD"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-3 border-t border-stone-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={
                subTab === "departments"
                  ? "Search departments by name or code..."
                  : "Search master subjects by name or code..."
              }
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {subTab === "subjects" && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[11px] font-bold text-[#525E4B] flex items-center gap-1">
                <Filter className="w-3 h-3 text-[#2A7C13]" /> Department:
              </span>
              <select
                value={selectedDeptFilter}
                onChange={(e) => setSelectedDeptFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-xl border border-[#D5CBB2] bg-white text-[#142010] focus:outline-none focus:border-[#2A7C13]"
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

      {/* Collapsible Setup Forms */}
      {showAddDeptForm && canManageAcademics && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-black text-[#142010] uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#2A7C13]" />
              <span>Create New Department</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddDeptForm(false)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <DepartmentCreateForm />
        </div>
      )}

      {showAddSubjectForm && canManageAcademics && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-black text-[#142010] uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#2A7C13]" />
              <span>Add Master Subject to Catalog</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAddSubjectForm(false)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <SubjectCreateForm departments={departments.map(({ id, name }) => ({ id, name }))} />
        </div>
      )}

      {showAssignHodForm && canManageSettings && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200/90 shadow-sm space-y-3 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-stone-100">
            <span className="text-xs font-black text-[#142010] uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-600" />
              <span>Assign Head of Department</span>
            </span>
            <button
              type="button"
              onClick={() => setShowAssignHodForm(false)}
              className="text-stone-400 hover:text-stone-700 cursor-pointer"
            >
              <X className="w-4 h-4" />
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
            <div className="bg-white rounded-2xl border border-dashed border-[#D5CBB2] p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <Building2 className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#142010]">No Departments Found</h4>
              <p className="text-xs text-[#525E4B] max-w-sm mx-auto">
                {searchTerm
                  ? "No departments match your search query."
                  : "No departments have been configured yet. Click 'New Department' above to create one."}
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

      {/* --- SUB-TAB 2: MASTER SUBJECTS CATALOG TABLE --- */}
      {subTab === "subjects" && (
        <div className="bg-white rounded-2xl border border-stone-200/90 overflow-hidden shadow-2xs">
          {filteredSubjects.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-400 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-[#142010]">No Master Subjects Found</h4>
              <p className="text-xs text-[#525E4B] max-w-sm mx-auto">
                {searchTerm || selectedDeptFilter
                  ? "No subjects match your search or department filter."
                  : "No subjects registered in the catalog yet."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200/90 bg-[#FAF8F2] text-[#525E4B] font-bold">
                    <th className="py-3 px-4">Subject Code</th>
                    <th className="py-3 px-4">Subject Name</th>
                    <th className="py-3 px-4">Department</th>
                    <th className="py-3 px-4 text-center">Coefficient (Weight)</th>
                    <th className="py-3 px-4 text-center">Max Denominator</th>
                    {canManageAcademics && <th className="py-3 px-4 text-center w-28">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredSubjects.map((sub) => (
                    <tr key={sub.id} className="hover:bg-[#FFFDF8] transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-[#142010]">
                        <span className="px-2 py-0.5 rounded-md bg-stone-100 text-stone-800 border border-stone-200 font-mono text-[11px]">
                          {sub.code}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-[#142010]">
                        {sub.name}
                      </td>
                      <td className="py-3 px-4 text-[#525E4B]">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-[#2A7C13]" />
                          <span>{sub.department?.name || "General / Unassigned"}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-mono font-bold text-[11px] border border-emerald-200/70">
                          <Scale className="w-3 h-3 text-[#2A7C13]" />
                          <span>{sub.default_coefficient}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-[#525E4B]">
                        /{sub.default_max_marks}
                      </td>
                      {canManageAcademics && (
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditCatalog(sub)}
                              disabled={isPending}
                              className="p-1.5 rounded-lg text-stone-500 hover:text-[#142010] hover:bg-stone-100 transition-colors cursor-pointer"
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
                              className="p-1.5 rounded-lg text-stone-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                              title={`Delete ${sub.name} from school catalog`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-stone-200 shadow-2xl w-full max-w-lg p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#2A7C13] flex items-center justify-center font-bold">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-[#142010]">
                    Edit Subject: {subjectToEdit.name}
                  </h4>
                  <p className="text-[11px] text-[#525E4B]">Master School Curriculum Record</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSubjectToEdit(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCatalogSubject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Subject Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#444444] mb-1">
                  Department
                </label>
                <select
                  value={editDeptId}
                  onChange={(e) => setEditDeptId(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13]"
                >
                  <option value="">General / No Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Code
                  </label>
                  <input
                    type="text"
                    required
                    value={editCode}
                    onChange={(e) => setEditCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 text-center font-mono font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white uppercase focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#444444] mb-1">
                    Coefficient
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="15"
                    required
                    value={editCoef}
                    onChange={(e) => setEditCoef(e.target.value)}
                    className="w-full px-3 py-2 text-center font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
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
                    className="w-full px-3 py-2 text-center font-bold text-xs rounded-xl border border-[#D5CBB2] text-[#142010] bg-white focus:outline-none focus:border-[#2A7C13] focus:ring-2 focus:ring-[#2A7C13]/10"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setSubjectToEdit(null)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 rounded-xl bg-[#2A7C13] hover:bg-[#20600E] text-white font-bold text-xs shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-red-200 shadow-2xl w-full max-w-md p-5 sm:p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm sm:text-base font-extrabold text-red-950">
                  Delete &ldquo;{subjectToDelete.name}&rdquo;?
                </h4>
                <p className="text-xs text-red-800 leading-relaxed">
                  Code: <strong className="font-mono">{subjectToDelete.code}</strong> · Department:{" "}
                  <strong>{subjectToDelete.department?.name || "General"}</strong>
                </p>
              </div>
            </div>

            <p className="text-xs text-[#525E4B] leading-relaxed bg-[#FAF8F2] p-3 rounded-xl border border-[#E8DFC9]">
              {deleteConfirmMarks
                ? "Assessment marks exist for this subject. Confirming will permanently delete all recorded student marks and remove this subject from all report cards."
                : "This subject will be permanently removed from the school catalog, class curricula, and report cards."}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setSubjectToDelete(null);
                  setDeleteConfirmMarks(false);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteCatalogSubject(deleteConfirmMarks)}
                disabled={isPending}
                className="px-5 py-2 rounded-xl bg-red-700 hover:bg-red-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>
                  {isPending ? "Deleting..." : deleteConfirmMarks ? "Delete Marks & Subject" : "Confirm Delete"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DepartmentsSubjectsManager;
