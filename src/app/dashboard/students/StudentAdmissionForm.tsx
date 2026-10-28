"use client";

import { useState } from "react";
import { registerStudentAction } from "@/app/academics/actions";
import {
  UserPlus,
  Sparkles,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface StreamOption {
  id: string;
  name: string;
}

interface Props {
  academicYearId: string;
  academicYearName: string;
  streams: StreamOption[];
  suggestedMatricule: string;
}

export function StudentAdmissionForm({
  academicYearId,
  academicYearName,
  streams,
  suggestedMatricule,
}: Props) {
  const [isOpen, setIsOpen] = useState(true);
  const [formData, setFormData] = useState({
    classStreamId: "",
    matricule: suggestedMatricule,
    firstName: "",
    lastName: "",
    gender: "M",
    residenceStatus: "day",
    isRepeater: false,
    rollNumber: "",
    guardianName: "",
    guardianPhone: "",
  });

  const [isManualMatricule, setIsManualMatricule] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field as user types
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
    if (generalError) setGeneralError(null);
  };

  const handleResetToAuto = () => {
    setFormData((prev) => ({ ...prev, matricule: suggestedMatricule }));
    setIsManualMatricule(false);
    if (fieldErrors.matricule) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.matricule;
        return next;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsPending(true);
    setGeneralError(null);
    setFieldErrors({});
    setSuccessMessage(null);

    const submission = new FormData();
    submission.set("academicYearId", academicYearId);
    submission.set("classStreamId", formData.classStreamId);
    submission.set("matricule", formData.matricule);
    submission.set("firstName", formData.firstName);
    submission.set("lastName", formData.lastName);
    submission.set("gender", formData.gender);
    submission.set("residenceStatus", formData.residenceStatus);
    submission.set("isRepeater", formData.isRepeater ? "true" : "false");
    submission.set("rollNumber", formData.rollNumber);
    submission.set("guardianName", formData.guardianName);
    submission.set("guardianPhone", formData.guardianPhone);

    try {
      const res = await registerStudentAction(null, submission);

      if (res && "error" in res && res.error) {
        setGeneralError(res.error);
        if ("fieldErrors" in res && res.fieldErrors) {
          setFieldErrors(res.fieldErrors as Record<string, string>);
        }
      } else if (res && "success" in res && res.success) {
        setSuccessMessage(
          res.message ||
            `Student "${formData.firstName} ${formData.lastName}" enrolled successfully.`
        );
        // Reset form while keeping stream selection and fetching a new suggested matricule if available
        setFormData((prev) => ({
          ...prev,
          firstName: "",
          lastName: "",
          gender: "M",
          residenceStatus: "day",
          isRepeater: false,
          rollNumber: "",
          guardianName: "",
          guardianPhone: "",
        }));
        setIsManualMatricule(false);
      }
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Failed to register student.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="w-full bg-white rounded-[8px] border border-[#E5E5DF] shadow-2xs overflow-hidden transition-all">
      {/* Header Bar */}
      <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EEEEEC] bg-[#FAFAF8]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#191919] text-white flex items-center justify-center shrink-0">
            <UserPlus className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-bold text-[#191919]">Admit Student</h2>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#F7F3E8] text-[#555555] border border-[#E8DFC9]">
                {academicYearName}
              </span>
            </div>
            <p className="text-[11px] text-[#777777]">
              Register and enroll a new student into the school register
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[5px] text-[11px] font-semibold text-[#555555] hover:text-[#191919] hover:bg-[#EFEFEA] transition-colors border border-[#D5D5CF]"
        >
          <span>{isOpen ? "Hide Form" : "Show Form"}</span>
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Form Body */}
      {isOpen && (
        <div className="p-5 sm:p-6 space-y-4">
          {generalError && (
            <div className="flex items-start gap-2 p-3.5 rounded-[6px] bg-red-50 border border-red-200 text-red-700 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div className="space-y-0.5">
                <span className="font-bold">Unable to admit student:</span>
                <p>{generalError}</p>
              </div>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center justify-between p-3.5 rounded-[6px] bg-[#F0FDF4] border border-[#BBF7D0] text-[#166534] text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-[#2A7C13]" />
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-[#166534] opacity-70 hover:opacity-100 text-xs font-bold"
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-[12px]">
            {/* Grid 1: Academic & Identification */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* 1. Class Group */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Class Group <span className="text-red-500">*</span>
                </label>
                <select
                  name="classStreamId"
                  value={formData.classStreamId}
                  onChange={(e) => updateField("classStreamId", e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-[12px] rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    fieldErrors.classStreamId
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                >
                  <option value="">Choose a class group</option>
                  {streams.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.classStreamId && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.classStreamId}
                  </p>
                )}
              </div>

              {/* 2. Matricule */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777]">
                    Student Matricule <span className="text-red-500">*</span>
                  </label>
                  {!isManualMatricule ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-[#2A7C13] font-medium">
                      <Sparkles className="w-3 h-3" />
                      Auto-generated
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResetToAuto}
                      className="inline-flex items-center gap-1 text-[10px] text-[#555555] hover:text-[#191919] underline cursor-pointer"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Reset to auto
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  name="matricule"
                  value={formData.matricule}
                  onChange={(e) => {
                    updateField("matricule", e.target.value);
                    setIsManualMatricule(true);
                  }}
                  placeholder={suggestedMatricule}
                  className={`w-full px-3 py-2 text-[12px] font-mono font-bold rounded-[5px] border bg-white text-[#191919] focus:outline-none transition-colors ${
                    fieldErrors.matricule
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                />
                {fieldErrors.matricule && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.matricule}
                  </p>
                )}
              </div>

              {/* 3. Roll Number */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Class Roster Roll No. (optional)
                </label>
                <input
                  type="number"
                  name="rollNumber"
                  min="1"
                  value={formData.rollNumber}
                  onChange={(e) => updateField("rollNumber", e.target.value)}
                  placeholder="e.g. 1, 2, 14 (position on roll)"
                  className={`w-full px-3 py-2 text-[12px] font-mono rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    fieldErrors.rollNumber
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                />
                {fieldErrors.rollNumber && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.rollNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Grid 2: Student Personal Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                  placeholder="e.g. John"
                  required
                  className={`w-full px-3 py-2 text-[12px] rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    fieldErrors.firstName
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                />
                {fieldErrors.firstName && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.firstName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                  placeholder="e.g. Fomban"
                  required
                  className={`w-full px-3 py-2 text-[12px] rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    fieldErrors.lastName
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                />
                {fieldErrors.lastName && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.lastName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Gender <span className="text-red-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-[12px] rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    fieldErrors.gender
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                >
                  <option value="M">Male (M)</option>
                  <option value="F">Female (F)</option>
                </select>
                {fieldErrors.gender && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.gender}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Residence <span className="text-red-500">*</span>
                </label>
                <select
                  name="residenceStatus"
                  value={formData.residenceStatus}
                  onChange={(e) => updateField("residenceStatus", e.target.value)}
                  required
                  className={`w-full px-3 py-2 text-[12px] rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    fieldErrors.residenceStatus
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                >
                  <option value="day">Day Student</option>
                  <option value="boarding">Boarding Student</option>
                </select>
                {fieldErrors.residenceStatus && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.residenceStatus}
                  </p>
                )}
              </div>
            </div>

            {/* Grid 3: Guardian Details & Academic Repetition */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  name="guardianName"
                  value={formData.guardianName}
                  onChange={(e) => updateField("guardianName", e.target.value)}
                  placeholder="e.g. Pa Thomas Fomban"
                  className={`w-full px-3 py-2 text-[12px] rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    fieldErrors.guardianName
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                />
                {fieldErrors.guardianName && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.guardianName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#777777] mb-1">
                  Parent / Guardian Phone
                </label>
                <input
                  type="tel"
                  name="guardianPhone"
                  value={formData.guardianPhone}
                  onChange={(e) => updateField("guardianPhone", e.target.value)}
                  placeholder="e.g. 677 12 34 56"
                  className={`w-full px-3 py-2 text-[12px] font-mono rounded-[5px] border bg-white focus:outline-none transition-colors ${
                    fieldErrors.guardianPhone
                      ? "border-red-400 focus:border-red-600 bg-red-50/20"
                      : "border-[#D5D5CF] focus:border-[#191919]"
                  }`}
                />
                {fieldErrors.guardianPhone && (
                  <p className="text-[11px] text-red-600 font-medium mt-1">
                    {fieldErrors.guardianPhone}
                  </p>
                )}
              </div>

              {/* Academic Repetition Status */}
              <div className="p-3 rounded-[6px] border border-[#E5E5DF] bg-[#FAF8F2] space-y-1.5">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-[#555555]">
                  Academic Status / Repetition <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => updateField("isRepeater", false)}
                    className={`py-1.5 px-2 rounded-[4px] border text-center font-semibold text-[11px] transition-all cursor-pointer ${
                      !formData.isRepeater
                        ? "bg-[#191919] border-[#191919] text-white shadow-2xs"
                        : "bg-white border-[#D5D5CF] text-[#555555] hover:bg-[#F0EFEB]"
                    }`}
                  >
                    Regular / New
                  </button>
                  <button
                    type="button"
                    onClick={() => updateField("isRepeater", true)}
                    className={`py-1.5 px-2 rounded-[4px] border text-center font-semibold text-[11px] transition-all cursor-pointer ${
                      formData.isRepeater
                        ? "bg-[#B45309] border-[#B45309] text-white shadow-2xs"
                        : "bg-white border-[#D5D5CF] text-[#555555] hover:bg-[#F0EFEB]"
                    }`}
                  >
                    Repeater
                  </button>
                </div>
                <p className="text-[10px] text-[#777777] leading-snug">
                  {formData.isRepeater
                    ? "✓ Marked as a repeater. Prints as Repeater: Yes [✓] on report cards."
                    : "✓ New to class level. Prints as Repeater: No [✓] on report cards."}
                </p>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EEEEEC]">
              <button
                type="submit"
                disabled={isPending}
                className="inline-flex items-center justify-center gap-1.5 px-6 py-2.5 bg-[#191919] hover:bg-[#333333] active:scale-[0.99] text-white font-semibold text-[13px] rounded-[5px] transition-all disabled:opacity-50 cursor-pointer shadow-xs"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Enrolling Student...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>Enroll Student</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
