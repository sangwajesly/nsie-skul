import fs from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.resolve(process.cwd(), "public", "uploads", "students");

export interface StoredMediaResult {
  url: string;
  storagePath: string;
  hash: string;
  sizeBytes: number;
}

/**
 * Saves a binary media buffer locally to the Hub appliance filesystem.
 * Returns public relative URL and SHA256 integrity hash.
 */
export async function storeMediaLocally(
  schoolId: string,
  studentId: string,
  buffer: Buffer,
  fileExtension: string = "jpg"
): Promise<StoredMediaResult> {
  const schoolDir = path.join(UPLOADS_DIR, schoolId);
  if (!fs.existsSync(schoolDir)) {
    fs.mkdirSync(schoolDir, { recursive: true });
  }

  const hash = crypto.createHash("sha256").update(buffer).digest("hex");
  const fileName = `${studentId}_${hash.slice(0, 8)}.${fileExtension.replace(/^\./, "")}`;
  const fullPath = path.join(schoolDir, fileName);

  fs.writeFileSync(fullPath, buffer);

  const relativeUrl = `/uploads/students/${schoolId}/${fileName}`;

  return {
    url: relativeUrl,
    storagePath: fullPath,
    hash,
    sizeBytes: buffer.length,
  };
}

/**
 * Checks if a media asset exists in the local Hub storage.
 */
export function hasLocalMedia(schoolId: string, fileName: string): boolean {
  const fullPath = path.join(UPLOADS_DIR, schoolId, fileName);
  return fs.existsSync(fullPath);
}

/**
 * Reads local media file as Buffer for Cloud sync transmission.
 */
export function readLocalMediaBuffer(schoolId: string, fileName: string): Buffer | null {
  const fullPath = path.join(UPLOADS_DIR, schoolId, fileName);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
}
