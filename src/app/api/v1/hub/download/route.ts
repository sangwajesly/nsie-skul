import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const exePath = path.join(process.cwd(), "public", "downloads", "NseiSukulHubSetup.exe");

  // Check if physical installer binary exists in public downloads
  if (fs.existsSync(exePath)) {
    const fileBuffer = fs.readFileSync(exePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.microsoft.portable-executable",
        "Content-Disposition": 'attachment; filename="NseiSukulHubSetup.exe"',
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  // Fallback: If installer binary is being compiled or hosted on GitHub Releases / CDN
  const releaseUrl =
    process.env.HUB_INSTALLER_RELEASE_URL ||
    "https://github.com/sangwajesly/nsie-skul/releases/latest/download/NseiSukulHubSetup.exe";

  return NextResponse.redirect(releaseUrl, { status: 302 });
}
