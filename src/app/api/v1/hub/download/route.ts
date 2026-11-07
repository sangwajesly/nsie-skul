import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

const SUPABASE_EXE_CDN_URL =
  "https://utgzjzwftdnmydvyxpwl.supabase.co/storage/v1/object/public/hub-releases/NseiSukulHubSetup.exe";

export async function GET(req: NextRequest) {
  // 1. If running locally or on physical machine with local binary available
  const localExePath = path.join(process.cwd(), "public", "downloads", "NseiSukulHubSetup.exe");
  if (fs.existsSync(localExePath)) {
    const fileBuffer = fs.readFileSync(localExePath);
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.microsoft.portable-executable",
        "Content-Disposition": 'attachment; filename="NseiSukulHubSetup.exe"',
        "Content-Length": String(fileBuffer.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  }

  // 2. In production on Vercel / serverless: stream directly from Supabase Storage CDN
  try {
    const upstreamRes = await fetch(SUPABASE_EXE_CDN_URL, {
      headers: { "User-Agent": "NseiSukul-App/1.0" },
    });

    if (upstreamRes.ok && upstreamRes.body) {
      return new NextResponse(upstreamRes.body, {
        status: 200,
        headers: {
          "Content-Type": "application/vnd.microsoft.portable-executable",
          "Content-Disposition": 'attachment; filename="NseiSukulHubSetup.exe"',
          "Content-Length": upstreamRes.headers.get("Content-Length") || "10890250",
          "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        },
      });
    }
  } catch (err) {
    console.error("Failed to stream installer from CDN:", err);
  }

  // Fallback 3: Direct redirect to public storage CDN
  return NextResponse.redirect(SUPABASE_EXE_CDN_URL, { status: 302 });
}
