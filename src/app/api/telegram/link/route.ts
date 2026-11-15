import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  generateTelegramLinkingToken,
  calculateTokenExpiration,
} from "@/lib/notifications/token";
import {
  buildTelegramDeepLink,
  isTelegramConfigured,
  getTelegramConfig,
} from "@/lib/notifications/telegram";

export const dynamic = "force-dynamic";

/**
 * GET /api/telegram/link
 * Checks the Telegram connection status for the authenticated user.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: link } = await supabase
    .from("telegram_links")
    .select("id, telegram_chat_id, telegram_username, is_active, linked_at")
    .eq("profile_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  return NextResponse.json(
    {
      success: true,
      data: {
        isConfigured: isTelegramConfigured(),
        isLinked: Boolean(link),
        botUsername: getTelegramConfig().botUsername,
        connection: link
          ? {
              id: link.id,
              username: link.telegram_username,
              linkedAt: link.linked_at,
            }
          : null,
      },
    },
    { status: 200 }
  );
}

/**
 * POST /api/telegram/link
 * Generates a single-use, 15-minute cryptographically secure linking token and bot deep-link.
 */
export async function POST() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const token = generateTelegramLinkingToken();
  const expiresAt = calculateTokenExpiration(15);

  // Store linking token in telegram_linking_tokens
  const { error: insertError } = await supabase
    .from("telegram_linking_tokens")
    .insert({
      token,
      profile_id: user.id,
      expires_at: expiresAt.toISOString(),
    });

  if (insertError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: insertError.message } },
      { status: 500 }
    );
  }

  const deepLink = buildTelegramDeepLink(token);

  return NextResponse.json(
    {
      success: true,
      data: {
        token,
        deepLink,
        expiresAt: expiresAt.toISOString(),
        instructions: "Open the deep-link in Telegram and tap Start to connect your account.",
        isBotConfigured: isTelegramConfigured(),
      },
    },
    { status: 201 }
  );
}

/**
 * DELETE /api/telegram/link
 * Safely unlinks the authenticated user's Telegram account.
 */
export async function DELETE() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("telegram_links")
    .delete()
    .eq("profile_id", user.id);

  if (error) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, message: "Telegram account successfully unlinked." },
    { status: 200 }
  );
}
