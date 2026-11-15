import { NextResponse } from "next/server";
import { EscalationEngine } from "@/lib/notifications/escalation-engine";

export const dynamic = "force-dynamic";

/**
 * POST /api/jobs/process-notifications
 * Protected scheduled job endpoint triggered by Vercel Cron or Google Cloud Scheduler.
 * Evaluates active medication occurrences in profile timezones and coordinates escalations.
 */
export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const providedBearer = authHeader?.startsWith("Bearer ")
    ? authHeader.substring(7).trim()
    : null;

  const url = new URL(req.url);
  const providedQuery = url.searchParams.get("secret");

  // Verify CRON_SECRET if configured in environment
  if (cronSecret && cronSecret !== "your_secure_random_cron_secret_placeholder") {
    const isAuthorized =
      providedBearer === cronSecret || providedQuery === cronSecret;

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Invalid or missing CRON_SECRET." } },
        { status: 401 }
      );
    }
  }

  try {
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
