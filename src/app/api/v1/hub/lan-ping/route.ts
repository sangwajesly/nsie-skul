import { NextResponse } from "next/server";
import { isSchoolHubInstance } from "@/lib/hub/hub-service";

export async function GET() {
  const isHub = isSchoolHubInstance();
  return NextResponse.json(
    {
      status: "ok",
      isHub,
      hubName: process.env.HUB_NAME || "School LAN Hub",
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
      },
    }
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
