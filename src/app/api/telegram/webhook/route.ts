import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyTelegramWebhookSecret,
  sendTelegramMessage,
} from "@/lib/notifications/telegram";
import { isTokenExpired } from "@/lib/notifications/token";

export const dynamic = "force-dynamic";

/**
 * POST /api/telegram/webhook
 * Receives incoming updates from the official Telegram Bot API.
 * Validates the X-Telegram-Bot-Api-Secret-Token header.
 */
export async function POST(req: Request) {
  const secretHeader = req.headers.get("x-telegram-bot-api-secret-token");

  // Verify webhook secret
  if (!verifyTelegramWebhookSecret(secretHeader)) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Invalid Telegram webhook secret." } },
      { status: 401 }
    );
  }

  try {
    const update = await req.json();

    // Only process private message text updates
    const message = update.message;
    if (!message || !message.text || !message.chat?.id) {
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const chatId = String(message.chat.id);
    const text = message.text.trim();
    const username = message.from?.username || message.from?.first_name || null;

    // Handle /start <token>
    if (text.startsWith("/start")) {
      const parts = text.split(" ");
      const token = parts[1]?.trim();

      if (!token) {
        await sendTelegramMessage(
          chatId,
          `<b>Welcome to VATSALYA (वात्सल्य)</b>\n\nCare beyond generations.\n\nTo link your Telegram account for reminders and care alerts, please generate a secure linking link from your VATSALYA dashboard and click the connection button.`
        );
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Validate linking token
      const supabase = createAdminClient();
      const { data: tokenRecord, error: tokenError } = await supabase
        .from("telegram_linking_tokens")
        .select("token, profile_id, expires_at")
        .eq("token", token)
        .maybeSingle();

      if (tokenError || !tokenRecord) {
        await sendTelegramMessage(
          chatId,
          `⚠️ <b>Invalid Linking Token</b>\n\nThis connection link was not found or has already been used. Please generate a new connection link from your VATSALYA dashboard.`
        );
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      if (isTokenExpired(tokenRecord.expires_at)) {
        // Delete expired token
        await supabase.from("telegram_linking_tokens").delete().eq("token", token);
        await sendTelegramMessage(
          chatId,
          `⏱️ <b>Connection Link Expired</b>\n\nFor your security, VATSALYA linking links expire after 15 minutes. Please generate a fresh link from your dashboard.`
        );
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Single-use guarantee: delete token immediately to prevent replay race conditions
      await supabase.from("telegram_linking_tokens").delete().eq("token", token);

      // Clean up any prior chat links for this profile
      await supabase
        .from("telegram_links")
        .delete()
        .eq("profile_id", tokenRecord.profile_id);

      // Bind Telegram chat_id to the verified profile
      const { error: linkError } = await supabase
        .from("telegram_links")
        .upsert(
          {
            profile_id: tokenRecord.profile_id,
            telegram_chat_id: chatId,
            telegram_username: username,
            is_active: true,
            linked_at: new Date().toISOString(),
          },
          { onConflict: "telegram_chat_id" }
        );

      if (linkError) {
        await sendTelegramMessage(
          chatId,
          `❌ <b>Connection Error</b>\n\nFailed to register account: ${linkError.message}. Please try again later.`
        );
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Send confirmation to user
      await sendTelegramMessage(
        chatId,
        `✅ <b>Account Successfully Connected!</b>\n\nNamaste! Your Telegram account is now securely linked to <b>VATSALYA</b>.\n\nYou will receive medication reminders and coordinated care updates directly here.`
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Bad Request" },
      { status: 400 }
    );
  }
}
