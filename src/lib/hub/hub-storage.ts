import fs from "fs";
import path from "path";
import crypto from "crypto";

function getUploadsDir(): string {
  const defaultDir = path.resolve(process.cwd(), "public", "uploads", "students");
  try {
    if (!fs.existsSync(defaultDir)) fs.mkdirSync(defaultDir, { recursive: true });
    fs.accessSync(defaultDir, fs.constants.W_OK);
    return defaultDir;
  } catch {}

  const baseDir = process.env.PROGRAMDATA || process.env.ALLUSERSPROFILE || process.env.LOCALAPPDATA || process.cwd();
  const fallbackDir = path.join(baseDir, "NseiSukulHub", "uploads", "students");
  if (!fs.existsSync(fallbackDir)) {
    try { fs.mkdirSync(fallbackDir, { recursive: true }); } catch {}
  }
  return fallbackDir;
}

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
  const uploadsDir = getUploadsDir();
  const schoolDir = path.join(uploadsDir, schoolId);
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
  const fullPath = path.join(getUploadsDir(), schoolId, fileName);
  return fs.existsSync(fullPath);
}

/**
 * Reads local media file as Buffer for Cloud sync transmission.
 */
export function readLocalMediaBuffer(schoolId: string, fileName: string): Buffer | null {
  const fullPath = path.join(getUploadsDir(), schoolId, fileName);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath);
}
