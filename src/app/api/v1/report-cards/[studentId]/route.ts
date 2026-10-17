import { NextRequest, NextResponse } from "next/server";
import { getStudentReportCard } from "@/lib/academic/report-card-service";
import { getTenantContext } from "@/lib/tenancy/context";
import { APP_CONFIG } from "@/lib/version";

interface Context {
  params: Promise<{
    studentId: string;
  }>;
}

export async function GET(request: NextRequest, context: Context) {
  const { studentId } = await context.params;
  const searchParams = request.nextUrl.searchParams;
  const termId = searchParams.get("termId") || "33333333-3333-3333-3333-333333333331";

  const tenantContext = await getTenantContext();
  const schoolId = tenantContext?.school?.id || "11111111-1111-1111-1111-111111111111";

  try {
    const reportData = await getStudentReportCard(schoolId, termId, studentId);

    if (!reportData) {
      return NextResponse.json(
        {
          error: "NotFound",
          message: `Report card data not found for student enrolment ID '${studentId}'.`,
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        version: APP_CONFIG.apiVersion,
        compliance: APP_CONFIG.compliance,
        generatedAt: new Date().toISOString(),
        data: reportData,
      },
      {
        status: 200,
        headers: {
          "X-Nsei-Api-Version": APP_CONFIG.apiVersion,
          "Cache-Control": "private, max-age=60",
        },
      }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load report card";
    return NextResponse.json(
      { error: "InternalError", message: msg },
      { status: 500 }
    );
  }
}
