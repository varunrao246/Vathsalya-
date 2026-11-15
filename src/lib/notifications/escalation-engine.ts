import { createAdminClient } from "../supabase/admin";
import {
  doesScheduleApplyOnDate,
  evaluateDoseOccurrenceStatus,
  buildScheduledDate,
  generateDoseOccurrenceKey,
} from "../medications/dose-engine";
import { generateNotificationIdempotencyKey } from "./token";
import {
  sendTelegramMessage,
  type TelegramReplyMarkup,
} from "./telegram";
import {
  NotificationType,
  DispatchResult,
} from "./types";

export interface EscalationEvaluationResult {
  healthcareProfileId: string;
  occurrenceKey: string;
  medicationName: string;
  targetTime: string;
  scheduledAt: string;
  stage: "NONE" | "UPCOMING_REMINDER" | "CARETAKER_OVERDUE" | "FAMILY_ADMIN_ALERT";
  dispatchedChannels: string[];
  skippedChannels: string[];
  errors: string[];
}

export interface ProcessNotificationsBatchOptions {
  profileIdFilter?: string;
  targetDateStr?: string; // YYYY-MM-DD
  currentTime?: Date;
  dryRun?: boolean;
}

/**
 * Deterministic Smart Care Escalation Engine.
 * Evaluates active medication occurrences and coordinates multi-channel alerts
 * while maintaining strict clinical wording and idempotent delivery.
 */
export class EscalationEngine {
  /**
   * Evaluates all active profiles or a specific profile, identifying due notifications
   * and executing idempotent, failure-isolated multi-channel dispatch.
   */
  static async processBatch(
    options: ProcessNotificationsBatchOptions = {}
  ): Promise<{
    processedProfiles: number;
    evaluatedOccurrences: number;
    notificationsCreated: number;
    dispatchedTelegram: number;
    dispatchedEmail: number;
    escalationEventsTriggered: number;
    results: EscalationEvaluationResult[];
  }> {
    const supabase = createAdminClient();
    const currentTime = options.currentTime || new Date();
    const targetDateStr =
      options.targetDateStr || currentTime.toISOString().split("T")[0];

    // 1. Fetch eligible healthcare profiles
    let profilesQuery = supabase
      .from("healthcare_profiles")
      .select("id, display_name, timezone, primary_elder_id");

    if (options.profileIdFilter) {
      profilesQuery = profilesQuery.eq("id", options.profileIdFilter);
    }

    const { data: healthcareProfiles, error: hpError } = await profilesQuery;
    if (hpError || !healthcareProfiles) {
      throw new Error(`Failed to query healthcare profiles: ${hpError?.message}`);
    }

    let evaluatedOccurrencesCount = 0;
    let notificationsCreatedCount = 0;
    let dispatchedTelegramCount = 0;
    const dispatchedEmailCount = 0;
    let escalationEventsCount = 0;
    const results: EscalationEvaluationResult[] = [];

    // 2. Iterate each healthcare profile in its own timezone
    for (const hp of healthcareProfiles) {
      const timeZone = (hp as unknown as { timezone?: string }).timezone || "Asia/Kolkata";

      // A. Fetch active members & their notification links/preferences
      const { data: members } = await supabase
        .from("profile_access_members")
        .select(`
          profile_id,
          role,
          can_confirm_doses,
          user:profiles(id, full_name, email, phone)
        `)
        .eq("healthcare_profile_id", hp.id)
        .eq("status", "ACTIVE");

      // B. Fetch verified Telegram links for members
      const memberUserIds = (members || []).map((m) => m.profile_id);
      const { data: telegramLinks } = await supabase
        .from("telegram_links")
        .select("profile_id, telegram_chat_id, is_active")
        .in("profile_id", memberUserIds.length > 0 ? memberUserIds : ["00000000-0000-0000-0000-000000000000"])
        .eq("is_active", true);

      // C. Fetch profile-specific notification preferences
      const { data: preferences } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("healthcare_profile_id", hp.id);

      // Helper to get preference for user
      const getPref = (profileId: string) => {
        return (
          preferences?.find((p) => p.profile_id === profileId) || {
            telegram_enabled: true,
            email_enabled: true,
            reminder_minutes_before: 15,
            overdue_caretaker_grace_minutes: 30,
            family_escalation_grace_minutes: 60,
          }
        );
      };

      // D. Fetch active medications with schedules
      const { data: medications } = await supabase
        .from("medications")
        .select(`
          id,
          name,
          dosage_strength,
          instructions,
          start_date,
          end_date,
          is_active,
          schedules:medication_schedules (
            id,
            medication_id,
            target_time,
            meal_timing,
            dose_quantity,
            frequency_type,
            days_of_week,
            reminder_minutes_before,
            is_active
          )
        `)
        .eq("healthcare_profile_id", hp.id)
        .eq("is_active", true)
        .is("deleted_at", null);

      // E. Fetch existing dose logs for this date
      const { data: doseLogs } = await supabase
        .from("dose_logs")
        .select("*")
        .eq("healthcare_profile_id", hp.id)
        .eq("scheduled_date", targetDateStr);

      // F. Evaluate each schedule occurrence
      for (const med of medications || []) {
        for (const sched of med.schedules || []) {
          const applies = doesScheduleApplyOnDate(
            {
              id: sched.id,
              medication_id: sched.medication_id,
              target_time: sched.target_time,
              meal_timing: sched.meal_timing,
              dose_quantity: sched.dose_quantity,
              frequency_type: sched.frequency_type,
              days_of_week: sched.days_of_week,
              reminder_minutes_before: sched.reminder_minutes_before,
              is_active: sched.is_active,
              start_date: med.start_date,
              end_date: med.end_date,
            },
            targetDateStr
          );

          if (!applies) continue;

          evaluatedOccurrencesCount++;

          const scheduledAt = buildScheduledDate(targetDateStr, sched.target_time, timeZone);
          const occurrenceKey = generateDoseOccurrenceKey(sched.id, scheduledAt);

          const existingLog = (doseLogs || []).find(
            (log) =>
              log.schedule_id === sched.id &&
              (log.scheduled_occurrence_key === occurrenceKey ||
                new Date(log.scheduled_at).getTime() === scheduledAt.getTime())
          );

          // If already finalized (TAKEN or SKIPPED), no alerts needed
          if (existingLog && (existingLog.status === "TAKEN" || existingLog.status === "SKIPPED")) {
            continue;
          }

          const status = evaluateDoseOccurrenceStatus({
            scheduledAt,
            currentTime,
            existingLog: existingLog ? { status: existingLog.status } : null,
          });

          const diffMs = currentTime.getTime() - scheduledAt.getTime();
          const diffMinutes = diffMs / (1000 * 60);

          const evalResult: EscalationEvaluationResult = {
            healthcareProfileId: hp.id,
            occurrenceKey,
            medicationName: med.name,
            targetTime: sched.target_time,
            scheduledAt: scheduledAt.toISOString(),
            stage: "NONE",
            dispatchedChannels: [],
            skippedChannels: [],
            errors: [],
          };

          // ===================================================================
          // STAGE 1: UPCOMING REMINDER (to Elderly Person or Managing Family Admin)
          // ===================================================================
          const reminderNoticeMinutes = sched.reminder_minutes_before || 15;
          // When currentTime is between [scheduledAt - reminderNoticeMinutes] and [scheduledAt]
          if (diffMinutes >= -reminderNoticeMinutes && diffMinutes <= 0 && (status === "UPCOMING" || status === "DUE")) {
            evalResult.stage = "UPCOMING_REMINDER";

            // Find recipient: Priority 1: ELDERLY, Priority 2: FAMILY_ADMIN, Priority 3: any active member
            const primaryRecipient =
              (members || []).find((m) => m.role === "ELDERLY") ||
              (members || []).find((m) => m.role === "FAMILY_ADMIN") ||
              (members || [])[0];

            if (primaryRecipient) {
              const pref = getPref(primaryRecipient.profile_id);
              const recipientTg = (telegramLinks || []).find(
                (t) => t.profile_id === primaryRecipient.profile_id
              );

              // Channel 1: Telegram with Interactive Inline Buttons
              if (pref.telegram_enabled && recipientTg?.telegram_chat_id) {
                const tgKey = generateNotificationIdempotencyKey([
                  hp.id,
                  occurrenceKey,
                  "TELEGRAM",
                  "UPCOMING_DOSE",
                  recipientTg.telegram_chat_id,
                ]);

                const messageText = `<b>ನಮಸ್ಕಾರ ${hp.display_name}!</b>\n\nIt is time for your scheduled medication:\n💊 <b>${med.name} (${med.dosage_strength})</b>\n⏰ Scheduled Time: <b>${sched.target_time}</b>\n${med.instructions ? `📝 Note: <i>${med.instructions}</i>\n` : ""}\nPlease confirm after taking your medicine:`;

                const unixSec = Math.floor(scheduledAt.getTime() / 1000);
                const replyMarkup: TelegramReplyMarkup = {
                  inline_keyboard: [
                    [
                      { text: "✅ TAKEN", callback_data: `T:${sched.id}:${unixSec}` },
                      { text: "⏰ REMIND IN 15M", callback_data: `S:${sched.id}:${unixSec}` },
                    ],
                    [
                      { text: "🆘 NEED HELP", callback_data: `H:${sched.id}:${unixSec}` },
                    ],
                  ],
                };

                const dispatched = await this.dispatchNotification({
                  supabase,
                  idempotencyKey: tgKey,
                  healthcareProfileId: hp.id,
                  recipientIdentifier: recipientTg.telegram_chat_id,
                  deliveryChannel: "TELEGRAM",
                  notificationType: "UPCOMING_DOSE",
                  title: `Medication Reminder: ${med.name}`,
                  message: messageText,
                  replyMarkup,
                  dryRun: options.dryRun,
                });

                if (dispatched.success) {
                  evalResult.dispatchedChannels.push("TELEGRAM_ELDERLY");
                  dispatchedTelegramCount++;
                  notificationsCreatedCount++;
                } else if (dispatched.error === "ALREADY_SENT") {
                  evalResult.skippedChannels.push("TELEGRAM_ALREADY_SENT");
                } else {
                  evalResult.errors.push(`TG_ERROR: ${dispatched.error}`);
                }
              }
            }
          }

          // ===================================================================
          // STAGE 2: CARETAKER ESCALATION (OVERDUE: 30m past scheduled time)
          // ===================================================================
          const caretakerGraceMinutes = 30;
          const familyEscalationMinutes = 60;

          if (diffMinutes >= caretakerGraceMinutes && diffMinutes < familyEscalationMinutes && (status === "OVERDUE" || status === "UNCONFIRMED")) {
            evalResult.stage = "CARETAKER_OVERDUE";

            // Find active caretakers
            const caretakers = (members || []).filter((m) => m.role === "CARETAKER");

            for (const caretaker of caretakers) {
              const pref = getPref(caretaker.profile_id);
              const caretakerTg = (telegramLinks || []).find(
                (t) => t.profile_id === caretaker.profile_id
              );

              // Ensure escalation_events record exists
              if (!options.dryRun) {
                await supabase.from("escalation_events").upsert(
                  {
                    healthcare_profile_id: hp.id,
                    schedule_occurrence_key: occurrenceKey,
                    medication_name: med.name,
                    target_time: sched.target_time,
                    scheduled_at: scheduledAt.toISOString(),
                    escalation_level: "CARETAKER_OVERDUE",
                    status: "PENDING",
                    assigned_caretaker_id: caretaker.profile_id,
                  },
                  { onConflict: "schedule_occurrence_key,escalation_level" }
                );
                escalationEventsCount++;
              }

              // Telegram Dispatch
              if (pref.telegram_enabled && caretakerTg?.telegram_chat_id) {
                const tgKey = generateNotificationIdempotencyKey([
                  hp.id,
                  occurrenceKey,
                  "TELEGRAM",
                  "OVERDUE_DOSE",
                  caretakerTg.telegram_chat_id,
                ]);

                const unixSec = Math.floor(scheduledAt.getTime() / 1000);
                const caretakerReplyMarkup: TelegramReplyMarkup = {
                  inline_keyboard: [
                    [
                      { text: "✅ ADMINISTERED", callback_data: `T:${sched.id}:${unixSec}` },
                      { text: "📞 CHECKED ON PATIENT", callback_data: `S:${sched.id}:${unixSec}` },
                    ],
                  ],
                };

                const dispatched = await this.dispatchNotification({
                  supabase,
                  idempotencyKey: tgKey,
                  healthcareProfileId: hp.id,
                  recipientIdentifier: caretakerTg.telegram_chat_id,
                  deliveryChannel: "TELEGRAM",
                  notificationType: "OVERDUE_DOSE",
                  title: `Care Alert: ${hp.display_name} medication pending`,
                  message: `⚠️ <b>VATSALYA Care Alert</b>\n\n<b>${hp.display_name}'s</b> ${sched.target_time} medication (<b>${med.name}</b>) confirmation is pending.\n\nPlease contact them or check whether assistance is required.`,
                  replyMarkup: caretakerReplyMarkup,
                  dryRun: options.dryRun,
                });

                if (dispatched.success) {
                  evalResult.dispatchedChannels.push("TELEGRAM_CARETAKER");
                  dispatchedTelegramCount++;
                  notificationsCreatedCount++;
                } else if (dispatched.error === "ALREADY_SENT") {
                  evalResult.skippedChannels.push("TELEGRAM_CARETAKER_ALREADY_SENT");
                }
              }
            }
          }

          // ===================================================================
          // STAGE 3: FAMILY ESCALATION (UNCONFIRMED: > 60m past scheduled time)
          // ===================================================================
          if (diffMinutes >= familyEscalationMinutes && (status === "OVERDUE" || status === "UNCONFIRMED")) {
            evalResult.stage = "FAMILY_ADMIN_ALERT";

            // Check if caretaker already resolved this escalation
            const { data: existingEscalation } = await supabase
              .from("escalation_events")
              .select("status, resolution_action")
              .eq("schedule_occurrence_key", occurrenceKey)
              .eq("escalation_level", "CARETAKER_OVERDUE")
              .maybeSingle();

            // If caretaker resolved it (e.g. administered or elder confirmed), do not escalate to family
            if (existingEscalation && existingEscalation.status === "RESOLVED") {
              continue;
            }

            const familyAdmins = (members || []).filter((m) => m.role === "FAMILY_ADMIN");

            for (const admin of familyAdmins) {
              const pref = getPref(admin.profile_id);
              const adminTg = (telegramLinks || []).find(
                (t) => t.profile_id === admin.profile_id
              );

              if (!options.dryRun) {
                await supabase.from("escalation_events").upsert(
                  {
                    healthcare_profile_id: hp.id,
                    schedule_occurrence_key: occurrenceKey,
                    medication_name: med.name,
                    target_time: sched.target_time,
                    scheduled_at: scheduledAt.toISOString(),
                    escalation_level: "FAMILY_ADMIN_ALERT",
                    status: "PENDING",
                  },
                  { onConflict: "schedule_occurrence_key,escalation_level" }
                );
                escalationEventsCount++;
              }

              // Telegram Dispatch
              if (pref.telegram_enabled && adminTg?.telegram_chat_id) {
                const tgKey = generateNotificationIdempotencyKey([
                  hp.id,
                  occurrenceKey,
                  "TELEGRAM",
                  "ESCALATION_ALERT",
                  adminTg.telegram_chat_id,
                ]);

                const unixSec = Math.floor(scheduledAt.getTime() / 1000);
                const familyReplyMarkup: TelegramReplyMarkup = {
                  inline_keyboard: [
                    [
                      { text: "✅ MARK TAKEN", callback_data: `T:${sched.id}:${unixSec}` },
                      { text: "📞 CHECKED IN", callback_data: `S:${sched.id}:${unixSec}` },
                    ],
                  ],
                };

                const dispatched = await this.dispatchNotification({
                  supabase,
                  idempotencyKey: tgKey,
                  healthcareProfileId: hp.id,
                  recipientIdentifier: adminTg.telegram_chat_id,
                  deliveryChannel: "TELEGRAM",
                  notificationType: "ESCALATION_ALERT",
                  title: `Family Escalation Alert: ${hp.display_name}`,
                  message: `📢 <b>VATSALYA Family Care Update</b>\n\n<b>${hp.display_name}'s</b> ${sched.target_time} medication (<b>${med.name}</b>) confirmation is pending.\n\nCaretaker follow-up was initiated. Please review the dashboard timeline for current status.`,
                  replyMarkup: familyReplyMarkup,
                  dryRun: options.dryRun,
                });

                if (dispatched.success) {
                  evalResult.dispatchedChannels.push("TELEGRAM_FAMILY_ADMIN");
                  dispatchedTelegramCount++;
                  notificationsCreatedCount++;
                }
              }
            }
          }

          if (evalResult.stage !== "NONE") {
            results.push(evalResult);
          }
        }
      }
    }

    return {
      processedProfiles: healthcareProfiles.length,
      evaluatedOccurrences: evaluatedOccurrencesCount,
      notificationsCreated: notificationsCreatedCount,
      dispatchedTelegram: dispatchedTelegramCount,
      dispatchedEmail: dispatchedEmailCount,
      escalationEventsTriggered: escalationEventsCount,
      results,
    };
  }

  /**
   * Dispatches a single notification event with idempotency, atomic claiming,
   * failure recording and provider isolation.
   */
  private static async dispatchNotification({
    supabase,
    idempotencyKey,
    healthcareProfileId,
    recipientIdentifier,
    deliveryChannel,
    notificationType,
    title,
    message,
    replyMarkup,
    dryRun,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any;
    idempotencyKey: string;
    healthcareProfileId: string;
    recipientIdentifier: string;
    deliveryChannel: "TELEGRAM" | "EMAIL";
    notificationType: NotificationType;
    title: string;
    message: string;
    replyMarkup?: TelegramReplyMarkup;
    emailPayload?: {
      to: string;
      subject: string;
      elderlyName: string;
      medicationName: string;
      scheduledTime: string;
      instructions?: string;
      escalationLevel?: string;
      actionRequired?: string;
    };
    dryRun?: boolean;
  }): Promise<{ success: boolean; error?: string }> {
    if (dryRun) {
      return { success: true };
    }

    // 1. Atomic Database Claim via PostgreSQL RPC
    let notificationId: string | null = null;
    const { data: claimResult, error: rpcError } = await supabase.rpc(
      "claim_notification_for_processing",
      {
        p_idempotency_key: idempotencyKey,
        p_healthcare_profile_id: healthcareProfileId,
        p_recipient_identifier: recipientIdentifier,
        p_delivery_channel: deliveryChannel,
        p_notification_type: notificationType,
        p_title: title,
        p_message: message,
        p_stale_lock_seconds: 300,
      }
    );

    if (!rpcError && claimResult && claimResult.length > 0) {
      const claim = claimResult[0];
      if (!claim.claimed) {
        return { success: false, error: claim.reason || "NOT_CLAIMED" };
      }
      notificationId = claim.notification_id;
    } else {
      // Fallback application-level atomic check & claim
      const { data: existing } = await supabase
        .from("notifications")
        .select("id, status, locked_at")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing) {
        if (existing.status === "SENT") {
          return { success: false, error: "ALREADY_SENT" };
        }
        if (existing.status === "PROCESSING") {
          const lockedAt = existing.locked_at ? new Date(existing.locked_at).getTime() : 0;
          if (Date.now() - lockedAt < 5 * 60 * 1000) {
            return { success: false, error: "CONCURRENT_LOCK_ACTIVE" };
          }
        }
      }

      const { data: claimedRow, error: claimError } = await supabase
        .from("notifications")
        .upsert(
          {
            idempotency_key: idempotencyKey,
            healthcare_profile_id: healthcareProfileId,
            recipient_identifier: recipientIdentifier,
            delivery_channel: deliveryChannel,
            notification_type: notificationType,
            title,
            message,
            status: "PROCESSING",
            locked_at: new Date().toISOString(),
            dispatched_at: new Date().toISOString(),
          },
          { onConflict: "idempotency_key" }
        )
        .select()
        .single();

      if (claimError || !claimedRow) {
        return { success: false, error: claimError?.message || "CLAIM_FAILED" };
      }
      notificationId = claimedRow.id;
    }

    // 2. Channel Execution (isolated failure handling)
    let dispatchResult: DispatchResult;

    if (deliveryChannel === "TELEGRAM") {
      dispatchResult = await sendTelegramMessage(recipientIdentifier, message, {
        parseMode: "HTML",
        replyMarkup,
      });
    } else {
      // Email is disabled per user requirements (Resend removed)
      dispatchResult = { success: false, channel: "EMAIL", error: "EMAIL_DISABLED" };
    }

    // 3. Update status based on provider response
    if (dispatchResult.success) {
      await supabase
        .from("notifications")
        .update({
          status: "SENT",
          provider_message_id: dispatchResult.providerMessageId || null,
          error_message: null,
          locked_at: null,
        })
        .eq("id", notificationId);

      return { success: true };
    } else {
      await supabase
        .from("notifications")
        .update({
          status: "FAILED",
          error_message: dispatchResult.error || "DISPATCH_FAILED",
          locked_at: null,
        })
        .eq("id", notificationId);

      return { success: false, error: dispatchResult.error };
    }
  }
}
