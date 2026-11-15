import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const startTime = Date.now();
  const hasSupabaseConfig = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let dbStatus = "unconfigured";
  let dbLatencyMs: number | null = null;

  if (hasSupabaseConfig) {
    try {
      const dbStart = Date.now();
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { error } = await supabase.from("healthcare_profiles").select("id").limit(1);
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = error ? `error: ${error.message}` : "connected";
    } catch (err: unknown) {
      dbStatus = `exception: ${err instanceof Error ? err.message : String(err)}`;
    }
  }

  return NextResponse.json(
    {
      status: "healthy",
      service: "vatsalya-web",
      version: "0.1.0",
      uptimeSeconds: Math.floor(process.uptime()),
      totalLatencyMs: Date.now() - startTime,
      environment: process.env.NODE_ENV || "development",
      timestamp: new Date().toISOString(),
      channels: {
        fcmReady: Boolean(process.env.FCM_PROJECT_ID),
        telegramReady: Boolean(process.env.TELEGRAM_BOT_TOKEN),
        resendReady: Boolean(process.env.RESEND_API_KEY),
      },
      database: {
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    },
    { status: 200 }
  );
}
