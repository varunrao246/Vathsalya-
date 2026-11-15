import { NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

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

      if (exchangeError || !data.user) {
        const loginUrl = new URL("/login", requestUrl.origin);
        loginUrl.searchParams.set("error", exchangeError?.message || "Failed to establish session.");
        return NextResponse.redirect(loginUrl);
      }

      const admin = createAdminClient();

      // Ensure user's profile record is populated with their Google OAuth metadata
      const meta = data.user.user_metadata || {};
      const fullName = (meta.full_name || meta.name || data.user.email?.split("@")[0] || "") as string;
      const avatarUrl = (meta.avatar_url || "") as string;

      await admin.from("profiles").upsert(
        {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || null,
          avatar_url: avatarUrl || null,
          preferred_language: "en",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      // Check if this user already has an existing healthcare profile access record
      const { data: members } = await admin
        .from("profile_access_members")
        .select("healthcare_profile_id, role, status")
        .eq("profile_id", data.user.id)
        .eq("status", "ACTIVE");

      if (members && members.length > 0) {
        // User has authorized healthcare profiles! Route based on their primary role
        const role = members[0].role;
        if (role === "ELDERLY") {
          return NextResponse.redirect(new URL("/dashboard/elderly", requestUrl.origin));
        }
        if (role === "CARETAKER") {
          return NextResponse.redirect(new URL("/dashboard/caretaker", requestUrl.origin));
        }
        return NextResponse.redirect(new URL("/dashboard/family", requestUrl.origin));
      }

      // New user with no healthcare profiles -> Redirect strictly to onboarding
      return NextResponse.redirect(new URL("/onboard", requestUrl.origin));
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
