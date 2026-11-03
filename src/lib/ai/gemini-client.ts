/**
 * Google Gemini REST API Client for Nsei Sukul
 * Uses standard HTTPS fetch to avoid heavyweight npm dependencies.
 * Supports Gemini 1.5 Flash / Gemini 2.0 Flash for low-latency, bilingual text & vision extraction.
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const DEFAULT_MODEL = "gemini-1.5-flash";

export interface GeminiTextMessage {
  role: "user" | "model" | "system";
  parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }>;
}

export interface GeminiGenerateOptions {
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  responseMimeType?: "text/plain" | "application/json";
  systemInstruction?: string;
}

export async function callGeminiApi(
  contents: GeminiTextMessage[],
  options: GeminiGenerateOptions = {}
): Promise<{ success: boolean; text?: string; error?: string }> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      error: "GEMINI_API_KEY is not configured in server environment.",
    };
  }

  const model = options.model || DEFAULT_MODEL;
  const endpoint = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: contents.map((c) => ({
      role: c.role === "system" ? "user" : c.role,
      parts: c.parts,
    })),
    generationConfig: {
      temperature: options.temperature ?? 0.3,
      maxOutputTokens: options.maxOutputTokens ?? 2048,
    },
  };

  if (options.systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: options.systemInstruction }],
    };
  }

  if (options.responseMimeType) {
    payload.generationConfig.responseMimeType = options.responseMimeType;
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("[Gemini API Error]", response.status, errBody);
      return {
        success: false,
        error: `Gemini API returned status ${response.status}`,
      };
    }

    const json = await response.json();
    const candidateText =
      json?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    return {
      success: true,
      text: candidateText,
    };
  } catch (err: any) {
    console.error("[Gemini Network Error]", err);
    return {
      success: false,
      error: err?.message || "Failed to communicate with Gemini API.",
    };
  }
}
