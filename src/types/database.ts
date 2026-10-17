export type SubsystemType = "anglophone" | "francophone" | "bilingual";
export type RankingMode = "enabled" | "disabled";
export type ApprovalWorkflow = "hod" | "principal";
export type MembershipStatus = "active" | "suspended" | "invited";
export type SubscriptionPlan = "pilot" | "standard" | "premium" | "custom";
export type SubscriptionStatus = "trial" | "active" | "past_due" | "canceled";

export interface School {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  logo_url: string | null;
  motto: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  subsystem: SubsystemType;
  currency: string;
  ranking_mode: RankingMode;
  result_approval_workflow: ApprovalWorkflow;
  receipt_prefix: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Permission {
  id: string;
  code: string;
  category: string;
  description: string | null;
  created_at: string;
}

export interface SchoolMembership {
  id: string;
  school_id: string;
  user_id: string;
  role_id: string;
  title: string | null;
  status: MembershipStatus;
  created_at: string;
  updated_at: string;
  // Joins
  school?: School;
  user?: UserProfile;
  role?: Role;
}

export interface SchoolSubscription {
  id: string;
  school_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  trial_ends_at: string | null;
  current_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  school_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

export interface AcademicYear {
  id: string;
  school_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

export interface Term {
  id: string;
  school_id: string;
  academic_year_id: string;
  term_number: 1 | 2 | 3;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  is_approved: boolean;
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface EvaluationSequence {
  id: string;
  school_id: string;
  term_id: string;
  sequence_number: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_open_for_marks: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  school_id: string;
  name: string;
  code: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  subjects?: Subject[];
  hod_assignments?: HodAssignment[];
}

export interface Subject {
  id: string;
  school_id: string;
  department_id: string | null;
  name: string;
  code: string;
  default_coefficient: number;
  default_max_marks: number;
  created_at: string;
  updated_at: string;
  department?: Department;
}

export interface SchoolClass {
  id: string;
  school_id: string;
  name: string;
  level_order: number;
  cycle: "cycle_1" | "cycle_2";
  created_at: string;
}

export interface ClassStream {
  id: string;
  school_id: string;
  class_id: string;
  academic_year_id: string;
  name: string;
  stream_tag: string | null;
  class_master_id: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  class?: SchoolClass;
  class_master?: UserProfile;
  enrolments_count?: number;
}

export interface ClassSubject {
  id: string;
  school_id: string;
  class_stream_id: string;
  subject_id: string;
  coefficient: number;
  max_marks: number;
  is_compulsory: boolean;
  created_at: string;
  updated_at: string;
  subject?: Subject;
}

export interface HodAssignment {
  id: string;
  school_id: string;
  academic_year_id: string;
  hod_user_id: string;
  department_id: string;
  subject_id: string | null;
  scope_type: "department" | "subject";
  start_date: string;
  end_date: string | null;
  status: "active" | "revoked";
  created_at: string;
  updated_at: string;
  hod_user?: UserProfile;
  department?: Department;
  subject?: Subject;
}

export interface TeacherAssignment {
  id: string;
  school_id: string;
  academic_year_id: string;
  teacher_user_id: string;
  class_stream_id: string;
  subject_id: string;
  created_at: string;
  updated_at: string;
  teacher?: UserProfile;
  class_stream?: ClassStream;
  subject?: Subject;
}

export interface Student {
  id: string;
  school_id: string;
  matricule: string;
  first_name: string;
  last_name: string;
  gender: "M" | "F";
  date_of_birth: string | null;
  place_of_birth: string | null;
  residence_status: "day" | "boarding";
  guardian_name: string | null;
  guardian_phone: string | null;
  guardian_email: string | null;
  status: "active" | "withdrawn" | "transferred" | "graduated" | "dismissed";
  created_at: string;
  updated_at: string;
}

export interface Enrolment {
  id: string;
  school_id: string;
  student_id: string;
  academic_year_id: string;
  class_stream_id: string;
  roll_number: number | null;
  enrolment_date: string;
  status: "active" | "promoted" | "repeated" | "withdrawn" | "dismissed";
  created_at: string;
  updated_at: string;
  student?: Student;
  class_stream?: ClassStream;
}

export type AssessmentStatus = "present" | "absent" | "exempt";

export interface AssessmentMark {
  id: string;
  school_id: string;
  academic_year_id: string;
  term_id: string;
  sequence_id: string;
  class_stream_id: string;
  subject_id: string;
  student_id: string;
  score: number | null;
  max_marks: number;
  normalized_score_20: number | null;
  status: AssessmentStatus;
  remarks: string | null;
  is_locked: boolean;
  entered_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  student?: Student;
  subject?: Subject;
  class_stream?: ClassStream;
  sequence?: EvaluationSequence;
}

export type ApprovalStatus = "draft" | "submitted" | "approved" | "rejected";

export interface DepartmentalApproval {
  id: string;
  school_id: string;
  academic_year_id: string;
  term_id: string;
  sequence_id: string;
  class_stream_id: string;
  department_id: string;
  subject_id: string | null;
  status: ApprovalStatus;
  approved_by: string | null;
  approved_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joins
  department?: Department;
  subject?: Subject;
  approver?: UserProfile;
}

export type CbaAppreciation = "SNA" | "SPA" | "SA" | "EXP";

export interface GradeAppreciationInfo {
  letter: string;
  cba: CbaAppreciation;
  label: string;
  minScore: number;
  maxScore: number;
}

export interface SubjectCompetency {
  id: string;
  school_id: string;
  subject_id: string;
  class_id: string | null;
  term_number: 1 | 2 | 3;
  description: string;
  order_index: number;
  created_at: string;
  updated_at: string;
  subject?: Subject;
}

export type ConductStatus = "satisfactory" | "warning" | "reprimand" | "suspension" | "dismissed";
export type AnnualDecision = "promoted" | "repeat" | "dismissed";

export interface TermResult {
  id: string;
  school_id: string;
  academic_year_id: string;
  term_id: string;
  class_stream_id: string;
  student_id: string;
  total_score: number;
  total_coef: number;
  term_average: number;
  rank: number | null;
  grade: string | null;
  cba_appreciation: CbaAppreciation | null;
  subjects_passed: number;
  total_subjects: number;
  unjustified_abs_hours: number;
  justified_abs_hours: number;
  late_count: number;
  punishment_hours: number;
  conduct_status: ConductStatus;
  class_master_remarks: string | null;
  principal_remarks: string | null;
  annual_decision: AnnualDecision | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  // Joins
  student?: Student;
  class_stream?: ClassStream;
  term?: Term;
}

export type ResidenceStatusFilter = "all" | "day" | "boarding";

export interface FeeStructure {
  id: string;
  school_id: string;
  academic_year_id: string;
  class_id: string | null;
  residence_status: ResidenceStatusFilter;
  name: string;
  total_amount: number;
  currency: string;
  created_at: string;
  updated_at: string;
  // Joins
  fee_items?: FeeItem[];
  class?: SchoolClass;
}

export interface FeeItem {
  id: string;
  school_id: string;
  fee_structure_id: string;
  name: string;
  amount: number;
  is_compulsory: boolean;
  term_number: 1 | 2 | 3 | null;
  created_at: string;
}

export type BillStatus = "unpaid" | "partial" | "paid" | "overpaid";

export interface StudentBill {
  id: string;
  school_id: string;
  academic_year_id: string;
  student_id: string;
  class_stream_id: string;
  fee_structure_id: string | null;
  total_billed: number;
  total_paid: number;
  balance: number;
  status: BillStatus;
  created_at: string;
  updated_at: string;
  // Joins
  student?: Student;
  class_stream?: ClassStream;
  fee_structure?: FeeStructure;
  payments?: FeePayment[];
}

export type PaymentMethod = "cash" | "momo" | "orange_money" | "bank_deposit";

export interface FeePayment {
  id: string;
  school_id: string;
  student_bill_id: string;
  student_id: string;
  academic_year_id: string;
  receipt_number: string;
  amount: number;
  payment_method: PaymentMethod;
  transaction_ref: string | null;
  payment_date: string;
  term_number: 1 | 2 | 3 | null;
  remarks: string | null;
  received_by: string | null;
  created_at: string;
  // Joins
  student?: Student;
  receiver?: UserProfile;
}

export type AttendanceStatus = "present" | "unjustified_absent" | "justified_absent" | "late" | "excused";

export interface AttendanceSession {
  id: string;
  school_id: string;
  academic_year_id: string;
  term_id: string;
  class_stream_id: string;
  session_date: string;
  period_type: "daily" | "morning" | "afternoon";
  recorded_by: string | null;
  created_at: string;
  // Joins
  class_stream?: ClassStream;
  recorder?: UserProfile;
  records?: AttendanceRecord[];
}

export interface AttendanceRecord {
  id: string;
  school_id: string;
  session_id: string;
  student_id: string;
  status: AttendanceStatus;
  hours_missed: number;
  justification_note: string | null;
  created_at: string;
  // Joins
  student?: Student;
}

export type SanctionType = "warning" | "reprimand" | "suspension" | "punishment" | "dismissed";

export interface DisciplinaryRecord {
  id: string;
  school_id: string;
  academic_year_id: string;
  term_id: string;
  student_id: string;
  class_stream_id: string;
  sanction_type: SanctionType;
  punishment_hours: number;
  suspension_days: number;
  infraction_reason: string;
  incident_date: string;
  recorded_by: string | null;
  status: "active" | "served" | "revoked";
  created_at: string;
  updated_at: string;
  // Joins
  student?: Student;
  class_stream?: ClassStream;
  recorder?: UserProfile;
}




