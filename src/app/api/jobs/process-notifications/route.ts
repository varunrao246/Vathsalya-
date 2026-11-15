import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { EscalationEngine } from "@/lib/notifications/escalation-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/jobs/process-notifications
 * Protected scheduled job endpoint triggered by Vercel Cron or Google Cloud Scheduler.
 * Evaluates active medication occurrences in profile timezones and coordinates escalations.
 *
 * Security Requirements:
 * - Requires Authorization: Bearer <CRON_SECRET> header ONLY.
 * - Query-parameter secrets are rejected.
 * - Constant-time comparison using crypto.timingSafeEqual.
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;

  // 1. Validate server environment configuration
  if (!cronSecret || cronSecret === "your_secure_random_cron_secret_placeholder") {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "SERVER_CONFIGURATION_ERROR",
          message: "CRON_SECRET is not configured on the server. Scheduled jobs are locked.",
        },
      },
      { status: 500 }
    );
  }

  // 2. Extract Bearer token from Authorization header only
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authorization header with 'Bearer <CRON_SECRET>' is required.",
        },
      },
      { status: 401 }
    );
  }

  const providedBearer = authHeader.substring(7).trim();

  // 3. Constant-time secret comparison
  const expectedBuffer = Buffer.from(cronSecret, "utf8");
  const providedBuffer = Buffer.from(providedBearer, "utf8");

  if (
    expectedBuffer.length !== providedBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, providedBuffer)
  ) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Invalid CRON_SECRET.",
        },
      },
      { status: 401 }
    );
  }

  try {
    const url = new URL(req.url);
    const dryRun = url.searchParams.get("dryRun") === "true";
    const profileIdFilter = url.searchParams.get("healthcareProfileId") || undefined;
    const targetDateStr = url.searchParams.get("date") || undefined;

    const stats = await EscalationEngine.processBatch({
      dryRun,
      profileIdFilter,
      targetDateStr,
      currentTime: new Date(),
    });

    return NextResponse.json(
      {
        success: true,
        timestamp: new Date().toISOString(),
        dryRun,
        stats: {
          processedProfiles: stats.processedProfiles,
          evaluatedOccurrences: stats.evaluatedOccurrences,
          notificationsCreated: stats.notificationsCreated,
          dispatchedTelegram: stats.dispatchedTelegram,
          dispatchedEmail: stats.dispatchedEmail,
          escalationEventsTriggered: stats.escalationEventsTriggered,
        },
        results: stats.results,
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "JOB_EXECUTION_ERROR",
          message: err instanceof Error ? err.message : "Unknown error during job execution",
        },
      },
      { status: 500 }
    );
  }
}
