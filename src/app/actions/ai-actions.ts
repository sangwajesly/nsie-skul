"use server";

import { getTenantContext } from "@/lib/tenancy/context";
import { callGeminiApi } from "@/lib/ai/gemini-client";
import {
  StudentPerformanceContext,
  MINESEC_CBA_SYSTEM_PROMPT,
  buildCbaUserPrompt,
  getOfflineFallbackRemarks,
} from "@/lib/ai/prompts/cba-remarks";
import {
  EnrolledStudentContext,
  MARKSHEET_VISION_SYSTEM_PROMPT,
  buildMarksheetOcrPrompt,
  ExtractedMarkRow,
} from "@/lib/ai/prompts/marksheet-ocr";
import { verifyAiAccess } from "@/lib/ai/access-service";

export interface GenerateRemarkResponse {
  success: boolean;
  source: "ai" | "offline_handbook";
  suggestions: { tone: string; text: string }[];
  accessType?: string;
  freeRemaining?: number;
  error?: string;
}

export interface MarksheetOcrResponse {
  success: boolean;
  maxMarks: number;
  rows: ExtractedMarkRow[];
  accessType?: string;
  error?: string;
}

/**
 * Checks AI access status for the current user and institution
 */
export async function getAiAccessStatusAction(feature: "remark" | "scanner") {
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";
  const userId = context?.user?.id || "";

  return await verifyAiAccess({
    schoolId,
    userId,
    feature,
    schoolMetadata: context?.school as any,
    userMetadata: context?.user as any,
  });
}

/**
 * Server Action: Generates 3 MINESEC-compliant CBA remarks
 */
export async function generateCbaRemarkAction(
  studentContext: StudentPerformanceContext
): Promise<GenerateRemarkResponse> {
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";
  const userId = context?.user?.id || "";

  // 1. Verify Access / Free Trial
  const access = await verifyAiAccess({
    schoolId,
    userId,
    feature: "remark",
    schoolMetadata: context?.school as any,
    userMetadata: context?.user as any,
  });

  if (!access.hasAccess) {
    return {
      success: false,
      source: "offline_handbook",
      suggestions: getOfflineFallbackRemarks(studentContext),
      error: "PAYWALL_REQUIRED",
    };
  }

  // 2. Call Gemini API
  const prompt = buildCbaUserPrompt(studentContext);
  const result = await callGeminiApi(
    [{ role: "user", parts: [{ text: prompt }] }],
    {
      systemInstruction: MINESEC_CBA_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.25,
    }
  );

  if (!result.success || !result.text) {
    // Graceful fallback to verified offline MINESEC handbook remarks
    console.warn("[AI Remark Suggester] Falling back to offline handbook remarks:", result.error);
    return {
      success: true,
      source: "offline_handbook",
      suggestions: getOfflineFallbackRemarks(studentContext),
      accessType: access.accessType,
      freeRemaining: access.freeRemarksRemaining,
    };
  }

  try {
    const parsed = JSON.parse(result.text);
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions : [];

    if (suggestions.length === 0) {
      throw new Error("Empty suggestions returned");
    }

    return {
      success: true,
      source: "ai",
      suggestions,
      accessType: access.accessType,
      freeRemaining: access.freeRemarksRemaining,
    };
  } catch (parseError) {
    console.error("[AI Remark JSON Parse Error]", parseError, result.text);
    return {
      success: true,
      source: "offline_handbook",
      suggestions: getOfflineFallbackRemarks(studentContext),
      accessType: access.accessType,
      freeRemaining: access.freeRemarksRemaining,
    };
  }
}

/**
 * Server Action: Extracts handwritten student marks from a marksheet photo
 */
export async function scanPaperMarksheetAction(
  formData: FormData
): Promise<MarksheetOcrResponse> {
  const context = await getTenantContext();
  const schoolId = context?.school?.id || "";
  const userId = context?.user?.id || "";

  // 1. Verify Access
  const access = await verifyAiAccess({
    schoolId,
    userId,
    feature: "scanner",
    schoolMetadata: context?.school as any,
    userMetadata: context?.user as any,
  });

  if (!access.hasAccess) {
    return {
      success: false,
      maxMarks: 20,
      rows: [],
      error: "PAYWALL_REQUIRED",
    };
  }

  // 2. Extract inputs from FormData
  const imageFile = formData.get("image") as File | null;
  const rosterJson = formData.get("roster") as string | null;
  const subjectName = (formData.get("subjectName") as string) || "Subject Evaluation";

  if (!imageFile) {
    return {
      success: false,
      maxMarks: 20,
      rows: [],
      error: "No marksheet image was provided.",
    };
  }

  let roster: EnrolledStudentContext[] = [];
  try {
    if (rosterJson) {
      roster = JSON.parse(rosterJson);
    }
  } catch {
    roster = [];
  }

  // 3. Convert image to base64
  const bytes = await imageFile.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Data = buffer.toString("base64");
  const mimeType = imageFile.type || "image/jpeg";

  // 4. Build Vision prompt
  const userTextPrompt = buildMarksheetOcrPrompt(roster, subjectName);

  const result = await callGeminiApi(
    [
      {
        role: "user",
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: userTextPrompt },
        ],
      },
    ],
    {
      systemInstruction: MARKSHEET_VISION_SYSTEM_PROMPT,
      responseMimeType: "application/json",
      temperature: 0.1,
    }
  );

  if (!result.success || !result.text) {
    return {
      success: false,
      maxMarks: 20,
      rows: [],
      error: result.error || "Vision recognition failed to process marksheet image.",
    };
  }

  try {
    const parsed = JSON.parse(result.text);
    const extractedRows: ExtractedMarkRow[] = Array.isArray(parsed?.extractedRows)
      ? parsed.extractedRows
      : [];
    const maxMarks = Number(parsed?.maxMarks) || 20;

    return {
      success: true,
      maxMarks,
      rows: extractedRows,
      accessType: access.accessType,
    };
  } catch (err: any) {
    console.error("[Marksheet OCR Parse Error]", err, result.text);
    return {
      success: false,
      maxMarks: 20,
      rows: [],
      error: "Could not decode structured table data from the marksheet photo.",
    };
  }
}
