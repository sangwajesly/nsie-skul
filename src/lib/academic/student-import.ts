import ExcelJS from "exceljs";
import { Readable } from "node:stream";

export const MAX_STUDENT_IMPORT_ROWS = 500;
export const MAX_STUDENT_IMPORT_FILE_SIZE = 2 * 1024 * 1024;

export interface StudentImportRecord {
  matricule: string;
  firstName: string;
  lastName: string;
  gender: "M" | "F";
  residenceStatus: "day" | "boarding";
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  guardianName: string | null;
  guardianPhone: string | null;
  guardianEmail: string | null;
}

export interface StudentImportRow {
  rowNumber: number;
  student: StudentImportRecord;
  errors: string[];
}

export interface ParsedStudentImport {
  rows: StudentImportRow[];
  errors: string[];
}

type ImportField = keyof StudentImportRecord;

const aliases: Record<ImportField, string[]> = {
  matricule: ["matricule", "studentid", "admissionnumber", "admissionno"],
  firstName: ["firstname", "givenname"],
  lastName: ["lastname", "familyname", "surname"],
  gender: ["gender", "sex"],
  residenceStatus: ["residencestatus", "residence", "boardingstatus"],
  dateOfBirth: ["dateofbirth", "dob", "birthdate"],
  placeOfBirth: ["placeofbirth", "birthplace"],
  guardianName: ["guardianname", "parentname", "parentguardianname"],
  guardianPhone: ["guardianphone", "parentphone", "contactphone"],
  guardianEmail: ["guardianemail", "parentemail", "contactemail"],
};

function normalizeHeader(value: string) {
  return value.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value).trim();
  }
  if (Array.isArray(value)) return value.map(cellToString).join("").trim();
  if (typeof value === "object") {
    const cellValue = value as Record<string, unknown>;
    if (typeof cellValue.text === "string") return cellValue.text.trim();
    if (Array.isArray(cellValue.richText)) return cellToString(cellValue.richText);
    if (cellValue.formula || cellValue.sharedFormula) return "";
    if ("result" in cellValue) return cellToString(cellValue.result);
  }
  return "";
}

function normalizeDate(value: string): string | null {
  if (!value) return null;

  const isoMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  const dayFirstMatch = value.match(/^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})$/);
  const parts = isoMatch
    ? [Number(isoMatch[1]), Number(isoMatch[2]), Number(isoMatch[3])]
    : dayFirstMatch
      ? [Number(dayFirstMatch[3]), Number(dayFirstMatch[2]), Number(dayFirstMatch[1])]
      : null;

  if (!parts) return null;

  const [year, month, day] = parts;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date.toISOString().slice(0, 10);
}

function normalizeGender(value: string): "M" | "F" | null {
  const normalized = value.trim().toLowerCase();
  if (["m", "male", "boy"].includes(normalized)) return "M";
  if (["f", "female", "girl"].includes(normalized)) return "F";
  return null;
}

function normalizeResidence(value: string): "day" | "boarding" | null {
  const normalized = value.toLowerCase().replace(/[^a-z]/g, "");
  if (["day", "daystudent", "dayscholar"].includes(normalized)) return "day";
  if (["boarding", "boarder", "boardingstudent"].includes(normalized)) return "boarding";
  return null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function parseStudentImportFile(file: File): Promise<ParsedStudentImport> {
  if (file.size === 0) return { rows: [], errors: ["The selected file is empty."] };
  if (file.size > MAX_STUDENT_IMPORT_FILE_SIZE) {
    return { rows: [], errors: ["Files must be 2 MB or smaller."] };
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension !== "csv" && extension !== "xlsx") {
    return { rows: [], errors: ["Upload a CSV or Excel .xlsx file."] };
  }

  const contents = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();

  try {
    if (extension === "csv") {
      const csvText = new TextDecoder("utf-8").decode(contents);
      await workbook.csv.read(Readable.from([csvText]), {
        parserOptions: { trim: true, ignoreEmpty: true },
      });
    } else {
      await workbook.xlsx.load(contents);
    }
  } catch {
    return { rows: [], errors: ["The file could not be read. Check that it is a valid CSV or .xlsx workbook."] };
  }

  const worksheet = workbook.worksheets.find((sheet) => sheet.state === "visible");
  if (!worksheet || worksheet.rowCount === 0) {
    return { rows: [], errors: ["The file does not contain a visible worksheet with student rows."] };
  }

  if (worksheet.columnCount > 32 || worksheet.rowCount > MAX_STUDENT_IMPORT_ROWS + 20) {
    return { rows: [], errors: [`The import is limited to ${MAX_STUDENT_IMPORT_ROWS} student rows and 32 columns.`] };
  }

  const fieldByHeader = new Map<string, ImportField>();
  for (const [field, fieldAliases] of Object.entries(aliases) as [ImportField, string[]][]) {
    for (const alias of fieldAliases) fieldByHeader.set(alias, field);
  }

  let headerRowNumber = 0;
  let columnForField = new Map<ImportField, number>();

  for (let rowNumber = 1; rowNumber <= Math.min(worksheet.rowCount, 20); rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const candidateColumns = new Map<ImportField, number>();
    for (let columnNumber = 1; columnNumber <= Math.min(row.cellCount, 32); columnNumber += 1) {
      const field = fieldByHeader.get(normalizeHeader(cellToString(row.getCell(columnNumber).value)));
      if (field && !candidateColumns.has(field)) candidateColumns.set(field, columnNumber);
    }

    if (["matricule", "firstName", "lastName", "gender", "residenceStatus"].every((field) => candidateColumns.has(field as ImportField))) {
      headerRowNumber = rowNumber;
      columnForField = candidateColumns;
      break;
    }
  }

  if (headerRowNumber === 0) {
    return {
      rows: [],
      errors: ["Required columns: Matricule, First Name, Last Name, Gender, and Residence Status."],
    };
  }

  const rows: StudentImportRow[] = [];
  for (let rowNumber = headerRowNumber + 1; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const row = worksheet.getRow(rowNumber);
    const values = new Map<ImportField, string>();
    for (const [field, columnNumber] of columnForField) {
      values.set(field, cellToString(row.getCell(columnNumber).value));
    }

    if ([...values.values()].every((value) => value === "")) continue;

    const matricule = values.get("matricule")?.trim().toUpperCase() || "";
    const firstName = values.get("firstName")?.trim() || "";
    const lastName = values.get("lastName")?.trim() || "";
    const gender = normalizeGender(values.get("gender") || "");
    const residenceStatus = normalizeResidence(values.get("residenceStatus") || "");
    const rawDateOfBirth = values.get("dateOfBirth") || "";
    const dateOfBirth = normalizeDate(rawDateOfBirth);
    const guardianEmail = values.get("guardianEmail")?.trim().toLowerCase() || null;
    const errors: string[] = [];

    if (!matricule) errors.push("Matricule is required.");
    else if (matricule.length > 50) errors.push("Matricule must be 50 characters or fewer.");
    if (!firstName) errors.push("First name is required.");
    else if (firstName.length > 100) errors.push("First name must be 100 characters or fewer.");
    if (!lastName) errors.push("Last name is required.");
    else if (lastName.length > 100) errors.push("Last name must be 100 characters or fewer.");
    if (!gender) errors.push("Gender must be M/F or Male/Female.");
    if (!residenceStatus) errors.push("Residence status must be Day or Boarding.");
    if (rawDateOfBirth && !dateOfBirth) errors.push("Date of birth must be YYYY-MM-DD or DD/MM/YYYY.");
    if (guardianEmail && !isValidEmail(guardianEmail)) errors.push("Guardian email is not valid.");

    rows.push({
      rowNumber,
      student: {
        matricule,
        firstName,
        lastName,
        gender: gender || "M",
        residenceStatus: residenceStatus || "day",
        dateOfBirth,
        placeOfBirth: values.get("placeOfBirth")?.trim() || null,
        guardianName: values.get("guardianName")?.trim() || null,
        guardianPhone: values.get("guardianPhone")?.trim() || null,
        guardianEmail,
      },
      errors,
    });

    if (rows.length > MAX_STUDENT_IMPORT_ROWS) {
      return { rows: [], errors: [`The import is limited to ${MAX_STUDENT_IMPORT_ROWS} student rows.`] };
    }
  }

  if (rows.length === 0) return { rows: [], errors: ["No student rows were found below the header row."] };

  const rowsByMatricule = new Map<string, StudentImportRow[]>();
  for (const row of rows) {
    const matchingRows = rowsByMatricule.get(row.student.matricule) || [];
    matchingRows.push(row);
    rowsByMatricule.set(row.student.matricule, matchingRows);
  }
  for (const duplicates of rowsByMatricule.values()) {
    if (duplicates.length > 1) {
      for (const row of duplicates) row.errors.push("Matricule is duplicated in this file.");
    }
  }

  return { rows, errors: [] };
}