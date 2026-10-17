import { GradeAppreciationInfo } from "@/types/database";

/**
 * Calculates official Cameroonian CBA & Letter Grade Appreciation
 * Based on score normalized out of 20:
 * - 17.00 - 20.00: Expert (EXP), Grade A+
 * - 15.00 - 16.99: Acquired (SA), Grade A
 * - 13.00 - 14.99: Acquired (SA), Grade B
 * - 10.00 - 12.99: Partially Acquired (SPA), Grade C
 * - 0.00  -  9.99: Not Acquired (SNA), Grade F / U
 *
 * This file contains pure mathematical functions safe for both client and server components.
 */
export function getGradeAppreciation(scoreOutOf20: number | null): GradeAppreciationInfo {
  if (scoreOutOf20 === null || isNaN(scoreOutOf20)) {
    return {
      letter: "-",
      cba: "SNA",
      label: "Not Evaluated",
      minScore: 0,
      maxScore: 20,
    };
  }

  if (scoreOutOf20 >= 17) {
    return {
      letter: "A+",
      cba: "EXP",
      label: "Expert / Compétence Parfaite",
      minScore: 17,
      maxScore: 20,
    };
  } else if (scoreOutOf20 >= 15) {
    return {
      letter: "A",
      cba: "SA",
      label: "Acquired / Bien Acquis",
      minScore: 15,
      maxScore: 16.99,
    };
  } else if (scoreOutOf20 >= 13) {
    return {
      letter: "B",
      cba: "SA",
      label: "Acquired / Acquis",
      minScore: 13,
      maxScore: 14.99,
    };
  } else if (scoreOutOf20 >= 10) {
    return {
      letter: "C",
      cba: "SPA",
      label: "Partially Acquired / En Progrès",
      minScore: 10,
      maxScore: 12.99,
    };
  } else {
    return {
      letter: "F",
      cba: "SNA",
      label: "Not Acquired / Non Acquis",
      minScore: 0,
      maxScore: 9.99,
    };
  }
}
