import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/clear-verification-session
 * Clears any temporary authentication cookies set during verification.
 * Ensures the user is strictly left in an unauthenticated state, requiring manual sign-in.
 */
export async function POST() {
  try {
    const supabase = await createServerSupabaseClient();
    await supabase.auth.signOut();

    // Explicitly delete any Supabase auth cookies
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll();
    for (const cookie of allCookies) {
      if (cookie.name.startsWith("sb-") || cookie.name.includes("supabase")) {
        cookieStore.delete(cookie.name);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to clear session",
      },
      { status: 500 }
    );
  }
}
