export type CertificateTemplateId = "classic_heritage" | "modern_laureate" | "subject_distinction";

export type AwardCategory =
  | "school_podium"
  | "class_podium"
  | "threshold_honor"
  | "subject_laureate";

export type EducationCycle = "Cycle 1" | "Cycle 2" | "All";

export interface HonorRollRecipient {
  studentId: string;
  studentName: string;
  matricule: string;
  gender?: string;
  className: string;
  streamName?: string;
  fullClassName: string;
  awardCategory: AwardCategory;
  awardTitle: string; // e.g. "Major Général · 1st Rank in Institution" or "Tableau d'Honneur avec Félicitations"
  rankLabel?: string; // e.g. "1st in School", "1st in Form 5A", "1er de la classe"
  average?: number; // out of 20
  appreciation?: string;
  subjectName?: string;
  subjectCode?: string;
  subjectMark?: number; // out of 20
  teacherName?: string;
  cycle?: "Cycle 1" | "Cycle 2";
}

export interface CertificateConfig {
  templateId: CertificateTemplateId;
  citation: string;
  issueDate: string;
  signatory1Title: string;
  signatory1Name: string;
  signatory2Title: string;
  signatory2Name: string;
  showSchoolLogo: boolean;
  showNationalHeader: boolean;
  showWatermark: boolean;
  showSealRosette: boolean;
  bilingualLabels: boolean;
}

export interface CertificateSchoolInfo {
  id: string;
  name: string;
  code?: string | null;
  logoUrl?: string | null;
  motto?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  subsystem?: "anglophone" | "francophone" | "bilingual";
}
