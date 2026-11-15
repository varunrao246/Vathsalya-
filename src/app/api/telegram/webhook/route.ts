import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  verifyTelegramWebhookSecret,
  sendTelegramMessage,
  answerTelegramCallbackQuery,
} from "@/lib/notifications/telegram";
import { isTokenExpired } from "@/lib/notifications/token";

export const dynamic = "force-dynamic";

/**
 * POST /api/telegram/webhook
 * Receives incoming updates from the official Telegram Bot API.
 * Validates the X-Telegram-Bot-Api-Secret-Token header.
 * Handles both command messages (/start <token>) and inline callback queries (TAKEN, SNOOZE, HELP).
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
    const supabase = createAdminClient();

    // ============================================================
    // 1. Handle Inline Button Callback Queries (TAKEN, SNOOZE, HELP)
    // ============================================================
    if (update.callback_query) {
      const cq = update.callback_query;
      const callbackId = cq.id;
      const chatId = String(cq.message?.chat?.id || cq.from?.id);
      const dataStr: string = cq.data || "";

      let action: "TAKEN" | "SNOOZE" | "HELP" | "" = "";
      let scheduleId = "";
      let scheduledAtStr = "";
      let occurrenceKey = "";

      if (dataStr.startsWith("T:") || dataStr.startsWith("S:") || dataStr.startsWith("H:")) {
        action = dataStr.startsWith("T:") ? "TAKEN" : dataStr.startsWith("S:") ? "SNOOZE" : "HELP";
        const parts = dataStr.split(":");
        scheduleId = parts[1] || "";
        const unixSec = Number(parts[2]) || Math.floor(Date.now() / 1000);
        const scheduledAtDate = new Date(unixSec * 1000);
        scheduledAtStr = scheduledAtDate.toISOString();
        occurrenceKey = `${scheduleId}_${scheduledAtStr}`;
      } else if (dataStr.startsWith("TAKEN:") || dataStr.startsWith("SNOOZE:") || dataStr.startsWith("HELP:")) {
        action = dataStr.startsWith("TAKEN:") ? "TAKEN" : dataStr.startsWith("SNOOZE:") ? "SNOOZE" : "HELP";
        occurrenceKey = dataStr.split(":")[1] || "";
        const underscoreIdx = occurrenceKey.indexOf("_");
        scheduleId = underscoreIdx !== -1 ? occurrenceKey.substring(0, underscoreIdx) : occurrenceKey;
        scheduledAtStr = underscoreIdx !== -1 ? occurrenceKey.substring(underscoreIdx + 1) : new Date().toISOString();
      }

      // A. TAKEN Callback
      if (action === "TAKEN") {
        const scheduledDate = scheduledAtStr.split("T")[0];

        // Fetch schedule and medication details
        const { data: sched } = await supabase
          .from("medication_schedules")
          .select("id, target_time, medication:medications(id, name, healthcare_profile_id)")
          .eq("id", scheduleId)
          .maybeSingle();

        const medData = sched?.medication as unknown as { id: string; name: string; healthcare_profile_id: string } | null;
        const hpId = medData?.healthcare_profile_id;
        const medName = medData?.name || "Medication";

        if (hpId) {
          // Record or update dose_logs with TAKEN
          await supabase.from("dose_logs").upsert(
            {
              schedule_id: scheduleId,
              scheduled_occurrence_key: occurrenceKey,
              healthcare_profile_id: hpId,
              scheduled_date: scheduledDate,
              scheduled_time: sched?.target_time || "08:30:00",
              scheduled_at: scheduledAtStr,
              status: "TAKEN",
              actor_role: "ELDERLY",
              recorded_at: new Date().toISOString(),
              notes: "Confirmed via Telegram inline button (TAKEN)",
            },
            { onConflict: "scheduled_occurrence_key" }
          );

          // Resolve pending escalation events
          await supabase
            .from("escalation_events")
            .update({
              status: "RESOLVED",
              resolved_at: new Date().toISOString(),
              resolution_action: "CONFIRMED_VIA_TELEGRAM",
            })
            .eq("schedule_occurrence_key", occurrenceKey);

          // Log in care_activities
          await supabase.from("care_activities").insert({
            healthcare_profile_id: hpId,
            actor_role: "SYSTEM",
            action_type: "DOSE_TAKEN_CONFIRMED",
            action_payload: {
              medicationName: medName,
              occurrenceKey,
              channel: "TELEGRAM",
            },
          });
        }

        await answerTelegramCallbackQuery(callbackId, "✅ Marked as TAKEN! Great job.");
        await sendTelegramMessage(
          chatId,
          `✅ <b>Dose Confirmed!</b>\n\n<b>${medName}</b> has been recorded as <b>TAKEN</b> at ${new Date().toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}.\n\nThank you for updating VATSALYA!`
        );

        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // B. SNOOZE Callback (Remind in 15 Minutes)
      if (action === "SNOOZE") {
        const { data: sched } = await supabase
          .from("medication_schedules")
          .select("id, medication:medications(id, name, healthcare_profile_id)")
          .eq("id", scheduleId)
          .maybeSingle();

        const medData = sched?.medication as unknown as { id: string; name: string; healthcare_profile_id: string } | null;
        const medName = medData?.name || "Medication";

        await answerTelegramCallbackQuery(callbackId, "⏰ Reminding you again in 15 minutes.");
        await sendTelegramMessage(
          chatId,
          `⏰ <b>Reminder Postponed (15m)</b>\n\nWe will send another alert for <b>${medName}</b> in 15 minutes.\nPlease keep a glass of water ready.`
        );

        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // C. HELP Callback (Need Assistance)
      if (action === "HELP") {
        const { data: sched } = await supabase
          .from("medication_schedules")
          .select("id, target_time, medication:medications(id, name, healthcare_profile_id)")
          .eq("id", scheduleId)
          .maybeSingle();

        const medData = sched?.medication as unknown as { id: string; name: string; healthcare_profile_id: string } | null;
        const hpId = medData?.healthcare_profile_id;
        const medName = medData?.name || "Medication";

        if (hpId) {
          // Create immediate URGENT escalation event
          await supabase.from("escalation_events").upsert(
            {
              healthcare_profile_id: hpId,
              schedule_occurrence_key: occurrenceKey,
              medication_name: medName,
              target_time: sched?.target_time || "Scheduled",
              scheduled_at: scheduledAtStr,
              escalation_level: "URGENT",
              status: "PENDING",
              reason: "Assistance requested by elderly user via Telegram inline button",
            },
            { onConflict: "schedule_occurrence_key,escalation_level" }
          );

          // Log in care_activities
          await supabase.from("care_activities").insert({
            healthcare_profile_id: hpId,
            actor_role: "ELDERLY",
            action_type: "ASSISTANCE_REQUESTED",
            action_payload: {
              medicationName: medName,
              occurrenceKey,
              channel: "TELEGRAM",
            },
          });

          // Notify Caretakers & Family Admins on Telegram
          const { data: careMembers } = await supabase
            .from("profile_access_members")
            .select("profile_id, role")
            .eq("healthcare_profile_id", hpId)
            .in("role", ["CARETAKER", "FAMILY_ADMIN"])
            .eq("status", "ACTIVE");

          if (careMembers && careMembers.length > 0) {
            const memberIds = careMembers.map((m) => m.profile_id);
            const { data: links } = await supabase
              .from("telegram_links")
              .select("telegram_chat_id")
              .in("profile_id", memberIds)
              .eq("is_active", true);

            for (const link of links || []) {
              if (link.telegram_chat_id !== chatId) {
                await sendTelegramMessage(
                  link.telegram_chat_id,
                  `🚨 <b>URGENT: Care Assistance Requested</b>\n\nAssistance requested regarding <b>${medName}</b> (${sched?.target_time}).\nPlease reach out or check on them immediately.`
                );
              }
            }
          }
        }

        await answerTelegramCallbackQuery(callbackId, "🆘 Help request recorded! Alerting care team.", true);
        await sendTelegramMessage(
          chatId,
          `🆘 <b>Help Request Recorded</b>\n\nYour care team has been alerted that you need assistance with <b>${medName}</b>.\nSomeone will contact you shortly.`
        );

        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Default acknowledgment for other callback queries
      await answerTelegramCallbackQuery(callbackId);
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    // ============================================================
    // 2. Handle Text Messages (like /start <token>)
    // ============================================================
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
          `<b>Welcome to VATSALYA (वात्सल्य)</b>\n\nCare beyond generations.\n\nTo link your Telegram account for reminders and care alerts, please generate a secure connection link from your VATSALYA dashboard and click the button.`
        );
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Validate linking token
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
        await supabase.from("telegram_linking_tokens").delete().eq("token", token);
        await sendTelegramMessage(
          chatId,
          `⏱️ <b>Connection Link Expired</b>\n\nFor your security, VATSALYA linking links expire after 15 minutes. Please generate a fresh link from your dashboard.`
        );
        return NextResponse.json({ ok: true }, { status: 200 });
      }

      // Single-use guarantee: delete token immediately
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
