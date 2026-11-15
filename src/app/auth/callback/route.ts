import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /auth/callback
 * Exchanges the Supabase Auth verification code for an authenticated session.
 * Used for email verification links and OAuth callbacks.
 */
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/onboard";
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");

  // Handle explicit Supabase Auth error redirects
  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set("error", errorDescription || error);
    return NextResponse.redirect(loginUrl);
  }

  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (!exchangeError) {
        // Verification successful: redirect to onboarding with verified flag
        const targetUrl = new URL(next, requestUrl.origin);
        targetUrl.searchParams.set("verified", "true");
        return NextResponse.redirect(targetUrl);
      }

      // If code exchange failed (e.g. expired or already used code)
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set("error", exchangeError.message);
      return NextResponse.redirect(loginUrl);
    } catch (err: unknown) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set(
        "error",
        err instanceof Error ? err.message : "Failed to verify email session"
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  // Fallback to login if no authorization code is present
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
