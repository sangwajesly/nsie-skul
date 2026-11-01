export type IdCardTemplate = "classic" | "modern" | "compact";

export type IdCardColorPreset = "forest" | "navy" | "maroon" | "purple" | "slate" | "custom";

export interface ColorThemeDefinition {
  id: IdCardColorPreset;
  name: string;
  primary: string;
  accent: string;
  lightBg: string;
}

export const COLOR_PRESETS: Record<IdCardColorPreset, ColorThemeDefinition> = {
  forest: {
    id: "forest",
    name: "Forest Green",
    primary: "#142010",
    accent: "#2A7C13",
    lightBg: "#EAF7E4",
  },
  navy: {
    id: "navy",
    name: "Royal Navy",
    primary: "#0F2942",
    accent: "#1D4ED8",
    lightBg: "#EFF6FF",
  },
  maroon: {
    id: "maroon",
    name: "Burgundy Maroon",
    primary: "#4A0E17",
    accent: "#991B1B",
    lightBg: "#FEF2F2",
  },
  purple: {
    id: "purple",
    name: "Royal Purple",
    primary: "#2E1065",
    accent: "#6D28D9",
    lightBg: "#F5F3FF",
  },
  slate: {
    id: "slate",
    name: "Dark Slate",
    primary: "#0F172A",
    accent: "#334155",
    lightBg: "#F1F5F9",
  },
  custom: {
    id: "custom",
    name: "Custom Color",
    primary: "#142010",
    accent: "#2A7C13",
    lightBg: "#EAF7E4",
  },
};

export interface StudentIdCardData {
  studentId: string;
  matricule: string;
  firstName: string;
  lastName: string;
  fullName: string;
  className: string;
  streamName: string;
  fullClassName: string;
  gender: "M" | "F" | string;
  dateOfBirth?: string | null;
  placeOfBirth?: string | null;
  photoUrl?: string | null;
  guardianName?: string | null;
  guardianPhone?: string | null;
  residenceStatus?: "day" | "boarding" | string;
  academicYearName: string;
  schoolName: string;
  schoolCode?: string;
  schoolLogoUrl?: string | null;
  schoolMotto?: string | null;
  schoolAddress?: string | null;
  schoolPhone?: string | null;
  schoolSubsystem?: string;
  classStreamId?: string;
}

export interface IdCardConfig {
  template: IdCardTemplate;
  colorPreset: IdCardColorPreset;
  customColor?: string;
  printLayout: "front_only" | "front_and_back" | "back_only";
  showEmergencyContact: boolean;
  showBarcode: boolean;
  showQRCode: boolean;
  issueDate: string;
  expiryDate: string;
  signatoryTitle: string;
}
