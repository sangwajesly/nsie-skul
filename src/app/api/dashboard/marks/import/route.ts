import { NextRequest, NextResponse } from "next/server";
import { getTenantContext } from "@/lib/tenancy/context";
import ExcelJS from "exceljs";
import { Readable } from "node:stream";
import { normalizeStatus, MarksImportResult, ParsedMarkRow } from "@/lib/academic/marks-import";

export const runtime = "nodejs";

function cellToString(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (typeof val === "string" || typeof val === "number" || typeof val === "boolean") {
    return String(val).trim();
  }
  if (val instanceof Date) return val.toISOString();
  if (typeof val === "object") {
    const obj = val as Record<string, unknown>;
    if (typeof obj.text === "string") return obj.text.trim();
    if ("result" in obj && obj.result !== undefined) return cellToString(obj.result);
  }
  return "";
}

function normalizeHeader(val: string): string {
  return val.replace(/^\uFEFF/, "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export async function POST(req: NextRequest) {
  try {
    const context = await getTenantContext();
    if (!context) {
      return NextResponse.json({ error: "Unauthorized session." }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const maxMarksRaw = formData.get("maxMarks") as string | null;
    const maxMarks = parseFloat(maxMarksRaw || "20") || 20;

    if (!file) {
      return NextResponse.json({ error: "Please choose an Excel or CSV file to import." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = new ExcelJS.Workbook();

    if (file.name.endsWith(".csv")) {
      const stream = Readable.from(buffer);
      await workbook.csv.read(stream);
    } else {
      await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
    }

    const worksheet = workbook.worksheets[0];
    if (!worksheet || worksheet.rowCount < 2) {
      return NextResponse.json({ error: "The uploaded file contains no data rows." }, { status: 400 });
    }

    const headerRow = worksheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell((cell, colNumber) => {
      headers[colNumber] = normalizeHeader(cellToString(cell.value));
    });

    let matriculeCol = -1;
    let nameCol = -1;
    let scoreCol = -1;
    let statusCol = -1;
    let remarksCol = -1;

    for (let c = 1; c < headers.length; c++) {
      const h = headers[c] || "";
      if (["matricule", "studentid", "admissionnumber", "admissionno", "mat", "id"].includes(h)) {
        matriculeCol = c;
      } else if (["studentname", "name", "fullname", "student", "pupil", "nom"].includes(h)) {
        nameCol = c;
      } else if (["score", "mark", "marks", "note", "grade", "testmark", "evaluation"].some((term) => h.includes(term))) {
        scoreCol = c;
      } else if (["status", "presence", "state", "attendance"].includes(h)) {
        statusCol = c;
      } else if (["remarks", "remark", "comment", "appreciation", "note"].includes(h) && remarksCol === -1) {
        remarksCol = c;
      }
    }

    if (matriculeCol === -1) matriculeCol = 1;
    if (nameCol === -1 && headers.length > 2) nameCol = 2;
    if (scoreCol === -1 && headers.length > 3) scoreCol = 3;

    const parsedRows: ParsedMarkRow[] = [];
    let errorCount = 0;

    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;

      const matricule = cellToString(row.getCell(matriculeCol).value);
      const studentName = nameCol > 0 ? cellToString(row.getCell(nameCol).value) : "";
      const rawScore = scoreCol > 0 ? cellToString(row.getCell(scoreCol).value) : "";
      const rawStatus = statusCol > 0 ? cellToString(row.getCell(statusCol).value) : "";
      const remarks = remarksCol > 0 ? cellToString(row.getCell(remarksCol).value) : "";

      if (!matricule && !studentName && !rawScore) return;

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
          error = `Score ${num} exceeds maximum denominator (${maxMarks}).`;
          errorCount++;
        } else {
          parsedScore = num;
          status = "present";
        }
      }

      parsedRows.push({
        matricule,
        studentName,
        score: parsedScore,
        status,
        remarks,
        error,
      });
    });

    const result: MarksImportResult = {
      totalRows: parsedRows.length,
      matchedCount: 0,
      unmatchedCount: 0,
      errorCount,
      parsedRows,
    };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to parse file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
