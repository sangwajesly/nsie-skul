/**
 * Nsei Sukul - Central Application & API Version Manifest
 * Standardized semantic release and domain compliance specification.
 */

export const APP_CONFIG = {
  name: "Nsei Sukul Managements System",
  version: "1.0.0-rc.1",
  releaseName: "Cameroon National Release (2026)",
  apiVersion: "v1",
  buildDate: "2026-10-17",
  environment: process.env.NODE_ENV || "development",
  compliance: {
    targetCurriculum: "Cameroon Secondary Education (CBA / APC Guidelines)",
    framework: "Competency-Based Approach (6-Sequence System)",
    sequencesPerYear: 6,
    termsPerYear: 3,
    subsystems: ["english_section", "french_section", "bilingual"],
    accountingCurrency: "XAF (FCFA)",
  },
  supportedApiVersions: ["v1"],
} as const;

export type AppVersionInfo = typeof APP_CONFIG;
