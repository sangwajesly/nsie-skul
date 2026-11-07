import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export interface HubVersionInfo {
  version: string;
  releaseDate: string;
  minSupportedVersion: string;
  downloadUrl: string;
  fileName: string;
  sha256Checksum: string | null;
  releaseNotes: string[];
  systemRequirements: {
    os: string;
    ram: string;
    disk: string;
  };
}

export async function GET(req: NextRequest) {
  const currentHubVersion = "1.2.0";
  const releaseDate = "2026-11-07";

  // Check query parameter if client sent current version
  const clientVersion = req.nextUrl.searchParams.get("currentVersion");
  const hasUpdate = Boolean(clientVersion && clientVersion !== currentHubVersion);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://nsei-sukul.klarifypath.com";

  const versionInfo: HubVersionInfo & { hasUpdate: boolean } = {
    version: currentHubVersion,
    releaseDate,
    minSupportedVersion: "1.0.0",
    downloadUrl: `${baseUrl}/downloads/NseiSukulHubSetup.exe`,
    fileName: "NseiSukulHubSetup.exe",
    sha256Checksum: null,
    hasUpdate,
    releaseNotes: [
      "Hardware node-locking with cryptographic lease validation",
      "Dead CMOS battery tolerance with active runtime hour tracking",
      "Windows Mobile Hotspot support (zero router required)",
      "Automated two-way marks sync on internet reconnect",
    ],
    systemRequirements: {
      os: "Windows 10 / Windows 11 (64-bit)",
      ram: "Minimum 4 GB (8 GB recommended)",
      disk: "500 MB free space",
    },
  };

  return NextResponse.json(versionInfo, {
    headers: {
      "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
