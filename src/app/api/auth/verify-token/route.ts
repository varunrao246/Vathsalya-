import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/verify-token
 * Verifies email confirmation token_hash without persisting session or writing cookies.
 * This completely isolates the verification process and protects unrelated active sessions.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { token_hash, type } = body;

    if (!token_hash) {
      return NextResponse.json(
        { success: false, error: "Missing token_hash parameter" },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { success: false, error: "Supabase credentials are not configured" },
        { status: 500 }
      );
    }

    // Isolated client: autoRefreshToken: false, persistSession: false
    const isolatedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const otpType: EmailOtpType = (type as EmailOtpType) || "signup";

    const { data, error } = await isolatedClient.auth.verifyOtp({
      token_hash,
      type: otpType,
    });

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: data.user?.email || null,
      userId: data.user?.id || null,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Failed to verify token",
      },
      { status: 500 }
    );
  }
}
