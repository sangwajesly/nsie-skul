/**
 * AI Access & Quota Verification Service
 * Enforces the dual-tier model:
 * 1. School-wide AI Suite (if school purchased)
 * 2. Teacher Personal AI Pass (if teacher purchased via MoMo/Orange Money)
 * 3. Free Trial Hook (5 free remarks and 1 free sheet scan per sequence)
 */

export interface AiAccessStatus {
  hasAccess: boolean;
  accessType: "school_license" | "teacher_personal_pass" | "free_trial" | "paywall_required";
  freeRemarksRemaining: number;
  freeScansRemaining: number;
  schoolName?: string;
}

const DEFAULT_FREE_REMARKS = 5;
const DEFAULT_FREE_SCANS = 1;

/**
 * Checks whether the current user / school can use an AI feature
 */
export async function verifyAiAccess(params: {
  schoolId: string;
  userId: string;
  feature: "remark" | "scanner";
  schoolMetadata?: Record<string, any>;
  userMetadata?: Record<string, any>;
}): Promise<AiAccessStatus> {
  const { schoolMetadata, userMetadata, feature } = params;

  // 1. Check School-Wide License
  const schoolHasAi = Boolean(
    schoolMetadata?.ai_enabled || 
    schoolMetadata?.plan === "enterprise" || 
    schoolMetadata?.features?.ai_suite === true
  );

  if (schoolHasAi) {
    return {
      hasAccess: true,
      accessType: "school_license",
      freeRemarksRemaining: 999999,
      freeScansRemaining: 999999,
    };
  }

  // 2. Check Teacher Personal Pass
  const teacherHasPass = Boolean(
    userMetadata?.has_personal_ai_pass === true ||
    (userMetadata?.ai_pass_expiry && new Date(userMetadata.ai_pass_expiry) > new Date())
  );

  if (teacherHasPass) {
    return {
      hasAccess: true,
      accessType: "teacher_personal_pass",
      freeRemarksRemaining: 999999,
      freeScansRemaining: 999999,
    };
  }

  // 3. Free Trial Calculation (stored in local metadata or memory)
  const remarksUsed = Number(userMetadata?.trial_remarks_used || 0);
  const scansUsed = Number(userMetadata?.trial_scans_used || 0);

  const freeRemarksRemaining = Math.max(0, DEFAULT_FREE_REMARKS - remarksUsed);
  const freeScansRemaining = Math.max(0, DEFAULT_FREE_SCANS - scansUsed);

  if (feature === "remark" && freeRemarksRemaining > 0) {
    return {
      hasAccess: true,
      accessType: "free_trial",
      freeRemarksRemaining,
      freeScansRemaining,
    };
  }

  if (feature === "scanner" && freeScansRemaining > 0) {
    return {
      hasAccess: true,
      accessType: "free_trial",
      freeRemarksRemaining,
      freeScansRemaining,
    };
  }

  // Paywall required
  return {
    hasAccess: false,
    accessType: "paywall_required",
    freeRemarksRemaining,
    freeScansRemaining,
  };
}
