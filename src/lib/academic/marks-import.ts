/**
 * Utilities for Marks CSV/Excel import and template generation
 */

export interface StudentRowData {
  studentId: string;
  matricule: string;
  fullName: string;
  gender?: string;
  score: number | null;
  status: "present" | "absent" | "exempt";
  remarks: string;
  isLocked?: boolean;
}

export interface ParsedMarkRow {
  matricule: string;
  studentName?: string;
  score: number | null;
  status: "present" | "absent" | "exempt";
  remarks: string;
  matchedStudentId?: string;
  matchedStudentName?: string;
  error?: string;
}

export interface MarksImportResult {
  totalRows: number;
  matchedCount: number;
  unmatchedCount: number;
  errorCount: number;
  parsedRows: ParsedMarkRow[];
}

/**
 * Generates CSV content pre-filled with students in the class group.
 */
export function generateMarksCsvTemplate(
  students: StudentRowData[],
  maxMarks: number,
  subjectName: string,
  streamName: string,
  sequenceName: string
): string {
  const header = ["Matricule", "Student Name", `Score (Max ${maxMarks})`, "Status (present/absent/exempt)", "Teacher Remarks"];
  
  const escapeCsv = (str: string | number | null | undefined): string => {
    if (str === null || str === undefined) return "";
    const s = String(str);
    if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = students.map((s) => [
    escapeCsv(s.matricule),
    escapeCsv(s.fullName),
    escapeCsv(s.score !== null ? s.score : ""),
    escapeCsv(s.status),
    escapeCsv(s.remarks || ""),
  ]);

  return [header.join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}

/**
 * Normalizes text for header detection
 */
function normalizeHeader(val: string): string {
  return val.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Normalizes status string to "present" | "absent" | "exempt"
 */
export function normalizeStatus(raw: string): "present" | "absent" | "exempt" {
  const s = raw.trim().toLowerCase();
  if (s.includes("abs") || s === "a" || s === "ab") return "absent";
  if (s.includes("ex") || s === "e" || s === "exc") return "exempt";
  return "present";
}

/**
 * Parses raw CSV string and matches against the students in the class.
 */
export function parseMarksCsv(
  csvText: string,
  existingStudents: StudentRowData[],
  maxMarks: number
): MarksImportResult {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  if (lines.length < 2) {
    return {
      totalRows: 0,
      matchedCount: 0,
      unmatchedCount: 0,
      errorCount: 0,
      parsedRows: [],
    };
  }

  // Detect delimiter: comma or semicolon
  const headerLine = lines[0];
  const delimiter = headerLine.includes(";") && !headerLine.includes(",") ? ";" : ",";

  const rawHeaders = splitCsvLine(headerLine, delimiter);
  const normalizedHeaders = rawHeaders.map(normalizeHeader);

  // Column index identification
  let matriculeIdx = -1;
  let nameIdx = -1;
  let scoreIdx = -1;
  let statusIdx = -1;
  let remarksIdx = -1;

  normalizedHeaders.forEach((h, idx) => {
    if (["matricule", "studentid", "admissionnumber", "admissionno", "mat", "id"].includes(h)) {
      matriculeIdx = idx;
    } else if (["studentname", "name", "fullname", "student", "pupil", "nom"].includes(h)) {
      nameIdx = idx;
    } else if (["score", "mark", "marks", "note", "grade", "testmark", "evaluation"].some((term) => h.includes(term))) {
      scoreIdx = idx;
    } else if (["status", "presence", "state", "attendance"].includes(h)) {
      statusIdx = idx;
    } else if (["remarks", "remark", "comment", "appreciation", "note"].includes(h) && remarksIdx === -1) {
      remarksIdx = idx;
    }
  });

  // Fallbacks if not detected by header name
  if (matriculeIdx === -1) matriculeIdx = 0;
  if (nameIdx === -1 && rawHeaders.length > 1) nameIdx = 1;
  if (scoreIdx === -1 && rawHeaders.length > 2) scoreIdx = 2;
  if (statusIdx === -1 && rawHeaders.length > 3) statusIdx = 3;
  if (remarksIdx === -1 && rawHeaders.length > 4) remarksIdx = 4;

  // Build lookup maps for existing students
  const matriculeMap = new Map<string, StudentRowData>();
  const nameMap = new Map<string, StudentRowData>();

  for (const s of existingStudents) {
    matriculeMap.set(s.matricule.trim().toLowerCase(), s);
    nameMap.set(s.fullName.trim().toLowerCase(), s);
  }

  const parsedRows: ParsedMarkRow[] = [];
  let matchedCount = 0;
  let unmatchedCount = 0;
  let errorCount = 0;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    const cells = splitCsvLine(rawLine, delimiter);
    if (cells.length === 0 || cells.every((c) => c === "")) continue;

    const matricule = (cells[matriculeIdx] || "").trim();
    const studentName = nameIdx >= 0 ? (cells[nameIdx] || "").trim() : "";
    const rawScore = scoreIdx >= 0 ? (cells[scoreIdx] || "").trim() : "";
    const rawStatus = statusIdx >= 0 ? (cells[statusIdx] || "").trim() : "";
    const remarks = remarksIdx >= 0 ? (cells[remarksIdx] || "").trim() : "";

    // Match student
    let matchedStudent = matricule ? matriculeMap.get(matricule.toLowerCase()) : undefined;
    if (!matchedStudent && studentName) {
      matchedStudent = nameMap.get(studentName.toLowerCase());
    }

    let parsedScore: number | null = null;
    let status = rawStatus ? normalizeStatus(rawStatus) : "present";
    let error: string | undefined;

    if (rawScore !== "") {
      const num = parseFloat(rawScore.replace(",", "."));
      if (isNaN(num)) {
        error = `Invalid score "${rawScore}". Must be a number.`;
        errorCount++;
      } else if (num < 0) {
        error = `Score cannot be negative (${num}).`;
        errorCount++;
      } else if (num > maxMarks) {
        error = `Score ${num} exceeds maximum (${maxMarks}).`;
        errorCount++;
      } else {
        parsedScore = num;
        status = "present";
      }
    } else if (status === "present") {
      // Empty score with present status is allowed (marks pending)
      parsedScore = null;
    }

    if (matchedStudent) {
      matchedCount++;
    } else {
      unmatchedCount++;
      if (!error && matricule) {
        error = `Matricule "${matricule}" not found in this class.`;
      }
    }

    parsedRows.push({
      matricule,
      studentName,
      score: parsedScore,
      status,
      remarks,
      matchedStudentId: matchedStudent?.studentId,
      matchedStudentName: matchedStudent?.fullName,
      error,
    });
  }

  return {
    totalRows: parsedRows.length,
    matchedCount,
    unmatchedCount,
    errorCount,
    parsedRows,
  };
}

/**
 * Splits a CSV line handling quoted values and delimiters.
 */
function splitCsvLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}
