/**
 * MINESEC Competency-Based Approach (CBA / APC) Report Card Appreciation Engine
 * Aligned with Cameroon Ministry of Secondary Education evaluation standards.
 */

export interface StudentPerformanceContext {
  studentName: string;
  gender?: string;
  score: number; // Score on 20
  maxScore?: number; // Usually 20
  subjectName?: string;
  classLevel?: string; // e.g. "Form 3", "3ème", "Lower Sixth"
  subsystem?: "anglophone" | "francophone" | "bilingual";
  rank?: number;
  totalStudents?: number;
  conductRemarks?: string;
  absencesHours?: number;
}

export const MINESEC_CBA_SYSTEM_PROMPT = `You are a certified Cameroon Secondary Education Pedagogic Inspector specialized in Competency-Based Approach (CBA / APC - Approche Par Compétences).
Your job is to generate exactly three distinct, professional, and ministerial-compliant report card appreciations for a student based on their evaluated score on 20 and academic context.

GUIDELINES:
1. Strict 20-Point Cameroon Scale:
   - 00.00 - 08.99 / 20 (Non Acquis / NA / Inadequate): Be constructive and diagnostic. Point out where the student struggles (e.g. foundational concepts, methodology, submission of assignments) without insults. Offer clear remediation.
   - 09.00 - 11.99 / 20 (En cours d'acquisition / ECA / Fair / Average): Acknowledge passing effort, but highlight the need for consistent revision and rigor to rise above average.
   - 12.00 - 14.99 / 20 (Acquis / A / Good / Satisfactory): Commend good mastery and active class participation. Encourage aiming for the honor roll.
   - 15.00 - 20.00 / 20 (Expert / A+ / Very Good / Excellent): Commend exceptional intellectual rigor, exemplary discipline, and high competence.

2. Tone & Phrasing:
   - Respectful, dignified, grammatically flawless, and actionable.
   - Avoid generic phrases like "Good" or "Can do better" without substance.
   - If language is English (Anglophone subsystem), write in Cameroon educational English. If French, write in Cameroon educational French.
   - If absences are high, mention regularity in attendance politely.

3. Output Format:
   Return valid JSON with an array named "suggestions" containing exactly 3 objects:
   {
     "suggestions": [
       { "tone": "Balanced", "text": "..." },
       { "tone": "Encouraging", "text": "..." },
       { "tone": "Direct", "text": "..." }
     ]
   }
`;

export function buildCbaUserPrompt(context: StudentPerformanceContext): string {
  const isFrench = context.subsystem === "francophone";
  const language = isFrench ? "French" : "English";

  return `Generate 3 report card appreciations in ${language} for this Cameroon secondary student:
- Student Name: ${context.studentName}
- Gender: ${context.gender || "Not specified"}
- Subject: ${context.subjectName || "Subject Evaluation"}
- Score: ${context.score.toFixed(1)} / ${context.maxScore || 20}
- Class Level: ${context.classLevel || "Secondary School"}
${context.rank && context.totalStudents ? `- Class Rank: ${context.rank} out of ${context.totalStudents}` : ""}
${context.absencesHours ? `- Unexcused Absences: ${context.absencesHours} hours` : ""}
${context.conductRemarks ? `- Conduct Notes: ${context.conductRemarks}` : ""}

Return valid JSON with exactly 3 suggestions.`;
}

/**
 * Deterministic offline fallback if Gemini API is unreachable or school is offline
 */
export function getOfflineFallbackRemarks(context: StudentPerformanceContext): { tone: string; text: string }[] {
  const isFrench = context.subsystem === "francophone";
  const score = context.score;

  if (isFrench) {
    if (score >= 15) {
      return [
        { tone: "Balanced", text: "Excellents résultats. Compétences parfaitement maîtrisées avec rigueur et régularité." },
        { tone: "Encouraging", text: "Travail remarquable et attitude exemplaire. Félicitations du conseil de classe." },
        { tone: "Direct", text: "Très bon trimestre. Poursuivez dans cette dynamique d'excellence." }
      ];
    }
    if (score >= 12) {
      return [
        { tone: "Balanced", text: "Bon travail d'ensemble. Les acquis fondamentaux sont consolidés." },
        { tone: "Encouraging", text: "Résultats satisfaisants. Avec un peu plus d'approfondissement personnel, vous pouvez viser le tableau d'honneur." },
        { tone: "Direct", text: "Trimestre satisfaisant. Maintenez les efforts." }
      ];
    }
    if (score >= 9) {
      return [
        { tone: "Balanced", text: "Ensemble moyen. Des acquis réels mais des irrégularités dans la méthode de travail." },
        { tone: "Encouraging", text: "Vous êtes proche de la moyenne satisfaisante. Renforcez la participation et la révision quotidienne." },
        { tone: "Direct", text: "Résultats passables. Travaillez avec plus de régularité." }
      ];
    }
    return [
      { tone: "Balanced", text: "Compétences non acquises. Des lacunes méthodologiques qui nécessitent une remédiation urgente." },
      { tone: "Encouraging", text: "Trimestre insuffisant. Ne baissez pas les bras: revoyez les cours fondamentaux et posez vos questions en classe." },
      { tone: "Direct", text: "Insuffisant. Redoublez d'efforts pour le prochain trimestre." }
    ];
  }

  // Anglophone fallback
  if (score >= 15) {
    return [
      { tone: "Balanced", text: "Exceptional mastery of core competencies. Demonstrates analytical rigor and consistent preparation." },
      { tone: "Encouraging", text: "Brilliant academic performance. An exemplary attitude commended by the Class Council." },
      { tone: "Direct", text: "Very good term. Maintain this trajectory of academic excellence." }
    ];
  }
  if (score >= 12) {
    return [
      { tone: "Balanced", text: "Good mastery of syllabus objectives. Solid understanding demonstrated across sequence tests." },
      { tone: "Encouraging", text: "Satisfactory work and commendable diligence. Strive for academic honors next term." },
      { tone: "Direct", text: "Good term. Keep up the disciplined effort." }
    ];
  }
  if (score >= 9) {
    return [
      { tone: "Balanced", text: "Fair performance. Basic competencies emerging but requires more rigorous personal revision." },
      { tone: "Encouraging", text: "Within reach of good standing. Focus on daily homework submission and class attentiveness." },
      { tone: "Direct", text: "Average results. Greater consistency is required." }
    ];
  }
  return [
    { tone: "Balanced", text: "Competencies not yet acquired. Immediate remedial revision required in foundational concepts." },
    { tone: "Encouraging", text: "Inadequate term, but progress is possible with committed daily practice and teacher consultation." },
    { tone: "Direct", text: "Unsatisfactory results. Step up your efforts urgently for the next sequence." }
  ];
}
