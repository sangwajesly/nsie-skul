/**
 * Gemini Vision Marksheet Table Extraction Prompt
 * Tailored for Cameroon Secondary School handwritten mark registers & paper tests.
 */

export interface EnrolledStudentContext {
  studentId: string;
  matricule: string;
  fullName: string;
}

export interface ExtractedMarkRow {
  studentId: string;
  matricule: string;
  fullName: string;
  extractedMark: number | null;
  confidence: "high" | "medium" | "low";
  notes?: string;
}

export const MARKSHEET_VISION_SYSTEM_PROMPT = `You are an expert optical recognition engine specialized in reading handwritten academic mark sheets from Cameroon secondary schools.

YOUR TASK:
1. You will be provided an image of a handwritten or printed class marksheet table.
2. You will also be provided the official roster of students enrolled in this specific class (their matricules and full names).
3. Read each row of the marksheet. Extract the score (numeric grade out of 20 or out of the maximum mark indicated on the sheet).
4. Match each handwritten student row to the closest student in the official class roster provided.

ACCURACY RULES:
- Grades in Cameroon are usually graded on 20 (e.g. 14.5, 08, 12/20). If a mark is out of 10 or 40, extract the numeric value as written.
- If a mark is blank, missing, marked as 'Abs' (Absent) or has a dash, set "extractedMark": null and add "notes": "Absent or blank".
- Disambiguate common handwritten confusion in French/English numbers:
  - 1 vs 7 (European style 7 with crossbar vs Anglophone 1).
  - 0 vs 6 or 8.
  - 5 vs 6.
- Set "confidence":
  - "high": The handwritten number is clear and unambiguously matches the student name.
  - "medium": The number is slightly blurry or stylized but likely correct.
  - "low": The handwriting is scratched out, ambiguous, or the name is difficult to distinguish.

OUTPUT FORMAT:
Return valid JSON matching this schema:
{
  "maxMarks": 20,
  "extractedRows": [
    {
      "studentId": "id-from-roster",
      "matricule": "matricule-from-roster",
      "fullName": "name-from-roster",
      "extractedMark": 14.5,
      "confidence": "high",
      "notes": ""
    }
  ],
  "unmatchedRowsCount": 0
}
`;

export function buildMarksheetOcrPrompt(roster: EnrolledStudentContext[], subjectName?: string): string {
  const rosterJson = JSON.stringify(roster.map((s) => ({
    id: s.studentId,
    matricule: s.matricule,
    name: s.fullName,
  })));

  return `Extract the student marks from this marksheet photo for subject "${subjectName || "Subject Evaluation"}".

Here is the OFFICIAL CLASS ROSTER to match against:
${rosterJson}

Match each row in the photo to the appropriate student in this roster and output the structured JSON.`;
}
