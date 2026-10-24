/**
 * Nsei Skul - Central Application & API Version Manifest
 * Standardized semantic release and domain compliance specification.
 */

export const APP_CONFIG = {
  name: "Nsei Skul",
  version: "1.0.0-rc.1",
  releaseName: "Bamenda Pilot (2026)",
  apiVersion: "v1",
  buildDate: "2026-10-17",
  environment: process.env.NODE_ENV || "development",
  compliance: {
    targetCurriculum: "Cameroon Secondary Education (CBA / APC Guidelines)",
    framework: "Competency-Based Approach (6-Sequence System)",
    sequencesPerYear: 6,
    termsPerYear: 3,
    subsystems: ["anglophone", "francophone", "bilingual"],
    accountingCurrency: "XAF (FCFA)",
  },
  supportedApiVersions: ["v1"],
} as const;

export type AppVersionInfo = typeof APP_CONFIG;
