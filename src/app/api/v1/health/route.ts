import { NextResponse } from "next/server";
import { APP_CONFIG } from "@/lib/version";

export async function GET() {
  return NextResponse.json(
    {
      status: "healthy",
      timestamp: new Date().toISOString(),
      app: {
        name: APP_CONFIG.name,
        version: APP_CONFIG.version,
        release: APP_CONFIG.releaseName,
        environment: APP_CONFIG.environment,
      },
      api: {
        currentVersion: APP_CONFIG.apiVersion,
        supportedVersions: APP_CONFIG.supportedApiVersions,
      },
      compliance: APP_CONFIG.compliance,
    },
    {
      status: 200,
      headers: {
        "X-Nsei-App-Version": APP_CONFIG.version,
        "X-Nsei-Api-Version": APP_CONFIG.apiVersion,
        "Cache-Control": "no-store",
      },
    }
  );
}
