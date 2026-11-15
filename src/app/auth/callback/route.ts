import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /auth/callback
 * Handles OAuth PKCE authentication callbacks (e.g. Google Sign-In)
 * and forwards legacy/external email confirmation links to /auth/confirm.
 */
export async function GET(req: Request) {
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get("code");
  const token_hash = requestUrl.searchParams.get("token_hash");
  const type = requestUrl.searchParams.get("type");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const next = requestUrl.searchParams.get("next") || "/onboard";

  // 1. If this is an email confirmation link (has token_hash or signup/email type), forward to /auth/confirm
  if (token_hash || type === "signup" || type === "email") {
    const confirmUrl = new URL("/auth/confirm", requestUrl.origin);
    requestUrl.searchParams.forEach((val, key) => {
      confirmUrl.searchParams.set(key, val);
    });
    return NextResponse.redirect(confirmUrl);
  }

  // 2. Handle explicit OAuth cancellation or failure
  if (error) {
    const loginUrl = new URL("/login", requestUrl.origin);
    loginUrl.searchParams.set(
      "error",
      errorDescription || "Authentication was cancelled or could not be completed."
    );
    return NextResponse.redirect(loginUrl);
  }

  // 3. Handle OAuth PKCE authorization code exchange
  if (code) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

      if (exchangeError) {
        const loginUrl = new URL("/login", requestUrl.origin);
        loginUrl.searchParams.set("error", exchangeError.message);
        return NextResponse.redirect(loginUrl);
      }

      // Check if this user already has an existing healthcare profile access record
      if (data.user?.id) {
        const { data: accesses } = await supabase
          .from("healthcare_profile_access")
          .select("role, status, profile_id")
          .eq("user_id", data.user.id)
          .eq("status", "ACTIVE")
          .limit(1);

        if (accesses && accesses.length > 0) {
          const role = accesses[0].role;
          if (role === "CARETAKER") {
            return NextResponse.redirect(new URL("/dashboard/caretaker", requestUrl.origin));
          }
          return NextResponse.redirect(new URL("/dashboard/family", requestUrl.origin));
        }
      }

      // New users proceed to onboarding to choose their setup role
      return NextResponse.redirect(new URL(next, requestUrl.origin));
    } catch (err: unknown) {
      const loginUrl = new URL("/login", requestUrl.origin);
      loginUrl.searchParams.set(
        "error",
        err instanceof Error ? err.message : "Failed to complete sign-in callback."
      );
      return NextResponse.redirect(loginUrl);
    }
  }

  // Fallback: If no code or error, redirect to login
  return NextResponse.redirect(new URL("/login", requestUrl.origin));
}
