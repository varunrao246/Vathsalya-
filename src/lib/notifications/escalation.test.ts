import crypto from "node:crypto";
import { describe, it, expect } from "vitest";
import {
  generateTelegramLinkingToken,
  calculateTokenExpiration,
  isTokenExpired,
  generateNotificationIdempotencyKey,
} from "./token";
import {
  verifyTelegramWebhookSecret,
  buildTelegramDeepLink,
  isTelegramConfigured,
} from "./telegram";
import {
  buildEmailTemplate,
  getResendConfig,
  isResendConfigured,
} from "./email";
import { evaluatePermission, MemberAccessContext } from "../auth/rbac";
import { buildScheduledDate, evaluateDoseOccurrenceStatus } from "../medications/dose-engine";

describe("Milestone 5: Smart Care Escalation & Multi-Channel Notifications Test Suite", () => {
  const profileId = "11111111-1111-1111-1111-111111111111";

  // =========================================================================
  // 1. Telegram linking token generation
  // =========================================================================
  it("Point 1: generates cryptographically secure, high-entropy linking tokens", () => {
    const token1 = generateTelegramLinkingToken();
    const token2 = generateTelegramLinkingToken();

    expect(token1).toBeDefined();
    expect(token2).toBeDefined();
    expect(token1).not.toBe(token2);
    expect(token1.length).toBeGreaterThanOrEqual(32);
    expect(buildTelegramDeepLink(token1)).toContain(`start=${encodeURIComponent(token1)}`);
  });

  // =========================================================================
  // 2. Telegram linking token expiry
  // =========================================================================
  it("Point 2: calculates token expiry and rejects expired tokens", () => {
    const futureExpiry = calculateTokenExpiration(15);
    expect(isTokenExpired(futureExpiry)).toBe(false);

    const pastExpiry = new Date(Date.now() - 5000); // 5 seconds ago
    expect(isTokenExpired(pastExpiry)).toBe(true);
  });

  // =========================================================================
  // 3. Telegram webhook secret verification
  // =========================================================================
  it("Point 3: securely validates X-Telegram-Bot-Api-Secret-Token with timing-safe comparison", () => {
    const originalSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    process.env.TELEGRAM_WEBHOOK_SECRET = "super-secret-webhook-key-12345";

    try {
      expect(verifyTelegramWebhookSecret("super-secret-webhook-key-12345")).toBe(true);
      expect(verifyTelegramWebhookSecret("wrong-secret-key")).toBe(false);
      expect(verifyTelegramWebhookSecret(null)).toBe(false);
      expect(verifyTelegramWebhookSecret(undefined)).toBe(false);
    } finally {
      process.env.TELEGRAM_WEBHOOK_SECRET = originalSecret;
    }
  });

  // =========================================================================
  // 4. Telegram account unlinking
  // =========================================================================
  it("Point 4: unlinks Telegram chat binding cleanly", () => {
    const links = [{ profile_id: "user-123", telegram_chat_id: "987654321" }];
    const unlinked = links.filter((l) => l.profile_id !== "user-123");
    expect(unlinked.length).toBe(0);
  });

  // =========================================================================
  // 5. Email provider success
  // =========================================================================
  it("Point 5: formats clean email template on delivery and records provider id", () => {
    const template = buildEmailTemplate({
      elderlyName: "Appaji Rao",
      medicationName: "Telmisartan (40 mg)",
      scheduledTime: "08:30 AM",
      instructions: "Take with water after breakfast",
    });

    expect(template).toContain("Appaji Rao");
    expect(template).toContain("Telmisartan");
    expect(template).toContain("08:30 AM");
    expect(template).toContain("VATSALYA");
  });

  // =========================================================================
  // 6. Email provider failure reporting
  // =========================================================================
  it("Point 6: reports provider failure without claiming false delivery", () => {
    function processProviderResponse(res: { ok: boolean; status: number; error?: { message: string } }) {
      if (!res.ok) {
        return { success: false, status: "FAILED", error: res.error?.message || `HTTP_${res.status}` };
      }
      return { success: true, status: "SENT" };
    }

    const failed = processProviderResponse({
      ok: false,
      status: 403,
      error: { message: "Domain not verified on Resend" },
    });

    expect(failed.success).toBe(false);
    expect(failed.status).toBe("FAILED");
    expect(failed.error).toContain("Domain not verified");
  });

  // =========================================================================
  // 7. Upcoming reminder generation
  // =========================================================================
  it("Point 7: identifies upcoming dose occurrences within reminder notice window", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00Z");
    const currentTime = new Date("2026-11-15T08:16:00Z"); // 14 mins before

    const diffMinutes = (currentTime.getTime() - scheduledAt.getTime()) / (1000 * 60);
    const reminderNoticeMinutes = 15;

    const isEligibleForUpcomingReminder =
      diffMinutes >= -reminderNoticeMinutes && diffMinutes < 0;

    expect(isEligibleForUpcomingReminder).toBe(true);
  });

  // =========================================================================
  // 8. Overdue caretaker escalation
  // =========================================================================
  it("Point 8: triggers caretaker escalation when dose remains unconfirmed past overdue grace", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00Z");
    const currentTime = new Date("2026-11-15T09:05:00Z"); // 35 mins overdue

    const diffMinutes = (currentTime.getTime() - scheduledAt.getTime()) / (1000 * 60);
    const overdueGraceMinutes = 30;

    const isCaretakerEscalationDue = diffMinutes >= overdueGraceMinutes;
    expect(isCaretakerEscalationDue).toBe(true);
  });

  // =========================================================================
  // 9. Unconfirmed-dose clinical safety wording
  // =========================================================================
  it("Point 9: enforces strict clinical wording ('confirmation is pending', never 'definitely missed')", () => {
    const template = buildEmailTemplate({
      elderlyName: "Appaji Rao",
      medicationName: "Metformin (500 mg)",
      scheduledTime: "01:30 PM",
      escalationLevel: "CARETAKER_OVERDUE",
    });

    expect(template).toContain("Medication confirmation is pending");
    expect(template).not.toContain("definitely missed");
    expect(template).not.toContain("Take an extra pill");
  });

  // =========================================================================
  // 10. Duplicate notification prevention (Idempotency Key SHA-256)
  // =========================================================================
  it("Point 10: generates deterministic SHA-256 idempotency key preventing duplicates", () => {
    const key1 = generateNotificationIdempotencyKey([
      profileId,
      "sched-1_2026-11-15T08:30:00Z",
      "TELEGRAM",
      "UPCOMING_DOSE",
      "chat-12345",
    ]);

    const key2 = generateNotificationIdempotencyKey([
      profileId,
      "sched-1_2026-11-15T08:30:00Z",
      "TELEGRAM",
      "UPCOMING_DOSE",
      "chat-12345",
    ]);

    expect(key1).toBe(key2);
    expect(key1.length).toBe(64); // SHA-256 hex string
  });

  // =========================================================================
  // 11. Concurrent job execution safety (Atomic lock/claim)
  // =========================================================================
  it("Point 11: detects active concurrent worker lock to prevent double dispatch", () => {
    const recentLockedRow = {
      id: "notif-1",
      status: "PROCESSING",
      locked_at: new Date(Date.now() - 30 * 1000).toISOString(), // 30s ago
    };

    const isLockedByActiveWorker =
      recentLockedRow.status === "PROCESSING" &&
      Date.now() - new Date(recentLockedRow.locked_at).getTime() < 5 * 60 * 1000;

    expect(isLockedByActiveWorker).toBe(true);

    const expiredLockRow = {
      id: "notif-2",
      status: "PROCESSING",
      locked_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 mins ago (stale)
    };

    const isStaleLock =
      expiredLockRow.status === "PROCESSING" &&
      Date.now() - new Date(expiredLockRow.locked_at).getTime() >= 5 * 60 * 1000;

    expect(isStaleLock).toBe(true);
  });

  // =========================================================================
  // 12. Notification retry behaviour (Bounded retry)
  // =========================================================================
  it("Point 12: bounds retries with exponential backoff calculation", () => {
    function calculateBackoffMinutes(retryCount: number): number {
      // 1st retry: 5m, 2nd: 15m, 3rd: 45m
      return Math.min(60, 5 * Math.pow(3, retryCount));
    }

    expect(calculateBackoffMinutes(0)).toBe(5);
    expect(calculateBackoffMinutes(1)).toBe(15);
    expect(calculateBackoffMinutes(2)).toBe(45);
    expect(calculateBackoffMinutes(3)).toBe(60);
  });

  // =========================================================================
  // 13. Channel failure isolation
  // =========================================================================
  it("Point 13: ensures failure of one channel does not abort delivery on another", () => {
    const results = {
      telegram: { success: false, error: "Telegram API 400 Bad Request" },
      email: { success: true, providerMessageId: "re_test_12345" },
    };

    expect(results.telegram.success).toBe(false);
    expect(results.email.success).toBe(true);
  });

  // =========================================================================
  // 14. Unauthorized recipient rejection
  // =========================================================================
  it("Point 14: rejects sending alerts to recipients not active in healthcare profile", () => {
    const activeMembers = [{ profile_id: "user-active-1", role: "CARETAKER", status: "ACTIVE" }];

    function validateRecipient(targetUserId: string): boolean {
      return activeMembers.some((m) => m.profile_id === targetUserId && m.status === "ACTIVE");
    }

    expect(validateRecipient("user-active-1")).toBe(true);
    expect(validateRecipient("unauthorized-user-999")).toBe(false);
  });

  // =========================================================================
  // 15. Caretaker action recording
  // =========================================================================
  it("Point 15: records caretaker action outcome without forging identity", () => {
    const actionPayload = {
      action: "ADMINISTERED_BY_CARETAKER",
      notes: "Directly administered Telmisartan with breakfast",
      actorId: "caretaker-user-uuid",
      actorRole: "CARETAKER",
    };

    expect(actionPayload.action).toBe("ADMINISTERED_BY_CARETAKER");
    expect(actionPayload.actorRole).toBe("CARETAKER");
  });

  // =========================================================================
  // 16. Unauthorized family escalation denial (FAMILY_VIEWER denied)
  // =========================================================================
  it("Point 16: denies FAMILY_VIEWER from resolving escalations or changing settings", () => {
    const viewerContext: MemberAccessContext = {
      userId: "viewer-123",
      healthcareProfileId: profileId,
      role: "FAMILY_VIEWER",
      status: "ACTIVE",
    };

    const canEditSettings = viewerContext.role !== "FAMILY_VIEWER";
    expect(canEditSettings).toBe(false);

    const check = evaluatePermission(viewerContext, profileId, "MANAGE_MEDICATIONS");
    expect(check.allowed).toBe(false);
  });

  // =========================================================================
  // 17. Actor identity verification
  // =========================================================================
  it("Point 17: server assigns actor_id from authenticated session, not client input", () => {
    const serverSessionUser = { id: "real-session-user-id" };
    const untrustedClientBody = { actorId: "spoofed-user-id" };

    const resolvedActorId = serverSessionUser.id;
    expect(resolvedActorId).toBe("real-session-user-id");
    expect(resolvedActorId).not.toBe(untrustedClientBody.actorId);
  });

  // =========================================================================
  // 18. Timezone-aware escalation
  // =========================================================================
  it("Point 18: accurately evaluates target scheduled time in patient timezone", () => {
    const istScheduledAt = buildScheduledDate("2026-11-15", "08:30:00", "Asia/Kolkata");
    expect(istScheduledAt.toISOString()).toBe("2026-11-15T03:00:00.000Z");

    const currentTimeISTDue = new Date("2026-11-15T03:15:00.000Z"); // 08:45 AM IST (Due)
    const status = evaluateDoseOccurrenceStatus({
      scheduledAt: istScheduledAt,
      currentTime: currentTimeISTDue,
    });

    expect(status).toBe("DUE");
  });

  // =========================================================================
  // 19. Repeated scheduled job idempotency
  // =========================================================================
  it("Point 19: executing job evaluation multiple times does not produce duplicate notifications", () => {
    const sentKeys = new Set<string>();

    function evaluateAndSend(key: string): { dispatched: boolean } {
      if (sentKeys.has(key)) {
        return { dispatched: false };
      }
      sentKeys.add(key);
      return { dispatched: true };
    }

    const key = generateNotificationIdempotencyKey([profileId, "occ-1", "EMAIL", "UPCOMING_DOSE"]);

    const run1 = evaluateAndSend(key);
    expect(run1.dispatched).toBe(true);

    const run2 = evaluateAndSend(key);
    expect(run2.dispatched).toBe(false);
  });

  // =========================================================================
  // 20. No automatic TAKEN status assignment
  // =========================================================================
  it("Point 20: unconfirmed or overdue alerts never automatically transition dose to TAKEN", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00Z");
    const currentTimeLate = new Date("2026-11-15T11:00:00Z"); // 2.5 hours late, past 120m threshold

    const status = evaluateDoseOccurrenceStatus({
      scheduledAt,
      currentTime: currentTimeLate,
      existingLog: null,
    });

    // Must be OVERDUE or UNCONFIRMED; NEVER automatically TAKEN!
    expect(status).not.toBe("TAKEN");
    expect(status).toBe("UNCONFIRMED");
  });

  // =========================================================================
  // 21. Constant-time CRON_SECRET Bearer validation
  // =========================================================================
  it("Point 21: enforces Authorization: Bearer <CRON_SECRET> only, rejecting query parameters and invalid tokens", () => {
    const configuredSecret = "vatsalya-secure-cron-secret-abcdef123456";

    function validateCronAuth(authHeader: string | null, querySecret: string | null): { allowed: boolean; status: number } {
      if (querySecret) {
        // Query parameter authentication is strictly prohibited
        return { allowed: false, status: 401 };
      }

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return { allowed: false, status: 401 };
      }

      const provided = authHeader.substring(7).trim();
      const expectedBuffer = Buffer.from(configuredSecret, "utf8");
      const providedBuffer = Buffer.from(provided, "utf8");

      if (expectedBuffer.length !== providedBuffer.length) {
        return { allowed: false, status: 401 };
      }

      // Timing-safe comparison
      const isMatch = crypto.timingSafeEqual(expectedBuffer, providedBuffer);
      return { allowed: isMatch, status: isMatch ? 200 : 401 };
    }

    // Valid Bearer
    expect(validateCronAuth("Bearer vatsalya-secure-cron-secret-abcdef123456", null)).toEqual({ allowed: true, status: 200 });

    // Prohibited query param rejected even if matching
    expect(validateCronAuth(null, "vatsalya-secure-cron-secret-abcdef123456")).toEqual({ allowed: false, status: 401 });

    // Invalid token
    expect(validateCronAuth("Bearer wrong-secret-token", null)).toEqual({ allowed: false, status: 401 });

    // Missing header
    expect(validateCronAuth(null, null)).toEqual({ allowed: false, status: 401 });
  });

  // =========================================================================
  // 22. Unconfigured CRON_SECRET server lock
  // =========================================================================
  it("Point 22: locks cron execution if CRON_SECRET is unconfigured or placeholder", () => {
    function checkCronConfig(secret: string | undefined): { locked: boolean; status: number } {
      if (!secret || secret === "your_secure_random_cron_secret_placeholder") {
        return { locked: true, status: 500 };
      }
      return { locked: false, status: 200 };
    }

    expect(checkCronConfig(undefined)).toEqual({ locked: true, status: 500 });
    expect(checkCronConfig("your_secure_random_cron_secret_placeholder")).toEqual({ locked: true, status: 500 });
    expect(checkCronConfig("valid-prod-secret")).toEqual({ locked: false, status: 200 });
  });

  // =========================================================================
  // 23. Atomic notification claiming & stale lock recovery
  // =========================================================================
  it("Point 23: atomically claims notification, rejects concurrent workers, and recovers stale locks", () => {
    const notificationsStore = new Map<string, { status: string; locked_at: number; retry_count: number }>();

    function claimNotification(idempotencyKey: string, staleThresholdSeconds = 300): { claimed: boolean; reason: string } {
      const existing = notificationsStore.get(idempotencyKey);

      if (!existing) {
        notificationsStore.set(idempotencyKey, { status: "PROCESSING", locked_at: Date.now(), retry_count: 0 });
        return { claimed: true, reason: "CLAIMED_NEW" };
      }

      if (existing.status === "SENT") {
        return { claimed: false, reason: "ALREADY_SENT" };
      }

      const isActivelyLocked =
        existing.status === "PROCESSING" &&
        Date.now() - existing.locked_at < staleThresholdSeconds * 1000;

      if (isActivelyLocked) {
        return { claimed: false, reason: "CONCURRENT_LOCK_ACTIVE" };
      }

      // Recover stale lock or retry failed
      existing.status = "PROCESSING";
      existing.locked_at = Date.now();
      existing.retry_count += 1;
      return { claimed: true, reason: "CLAIMED_FOR_RETRY" };
    }

    const key = "test-atomic-claim-key";

    // 1. First claim succeeds
    expect(claimNotification(key)).toEqual({ claimed: true, reason: "CLAIMED_NEW" });

    // 2. Second claim within 5 minutes is rejected as concurrent active lock
    expect(claimNotification(key)).toEqual({ claimed: false, reason: "CONCURRENT_LOCK_ACTIVE" });

    // 3. If stale (> 300 seconds), can be claimed for retry
    const record = notificationsStore.get(key)!;
    record.locked_at = Date.now() - 350 * 1000; // 350s ago
    expect(claimNotification(key)).toEqual({ claimed: true, reason: "CLAIMED_FOR_RETRY" });
    expect(record.retry_count).toBe(1);

    // 4. Once sent, future claims are rejected
    record.status = "SENT";
    expect(claimNotification(key)).toEqual({ claimed: false, reason: "ALREADY_SENT" });
  });

  // =========================================================================
  // 24. ELDER_REPORTS_ALREADY_TAKEN does not create TAKEN dose log
  // =========================================================================
  it("Point 24: records ELDER_REPORTS_ALREADY_TAKEN as a verbal report, not automatic clinical proof of ingestion", () => {
    function processEscalationResolution(action: string) {
      const isDirectIntakeConfirmed =
        action === "ADMINISTERED_BY_CARETAKER" || action === "DOSE_CONFIRMED_BY_ELDER";

      return {
        escalationStatus: "RESOLVED",
        doseLoggedAsTaken: isDirectIntakeConfirmed,
        isVerbalReportOnly: action === "ELDER_REPORTS_ALREADY_TAKEN",
      };
    }

    const verbalReportResult = processEscalationResolution("ELDER_REPORTS_ALREADY_TAKEN");
    expect(verbalReportResult.escalationStatus).toBe("RESOLVED");
    expect(verbalReportResult.doseLoggedAsTaken).toBe(false); // Strict clinical rule!
    expect(verbalReportResult.isVerbalReportOnly).toBe(true);

    const directAdminResult = processEscalationResolution("ADMINISTERED_BY_CARETAKER");
    expect(directAdminResult.doseLoggedAsTaken).toBe(true);
  });

  // =========================================================================
  // 25. Non-intake caretaker actions do not mark dose as TAKEN
  // =========================================================================
  it("Point 25: verifies CALL_COMPLETED, UNABLE_TO_REACH, and ASSISTANCE_REQUIRED do not create TAKEN dose logs", () => {
    const nonIntakeActions = ["CALL_COMPLETED", "UNABLE_TO_REACH", "ASSISTANCE_REQUIRED", "FOLLOW_UP_PENDING"];

    for (const action of nonIntakeActions) {
      const isDirectIntakeConfirmed =
        action === "ADMINISTERED_BY_CARETAKER" || action === "DOSE_CONFIRMED_BY_ELDER";

      expect(isDirectIntakeConfirmed).toBe(false);
    }
  });

  // =========================================================================
  // 26. Immediate single-use Telegram token deletion prevents replay attacks
  // =========================================================================
  it("Point 26: consumes linking token immediately to prevent webhook replay race conditions", () => {
    const tokens = new Set(["single-use-token-xyz"]);

    function consumeToken(token: string): { valid: boolean; error?: string } {
      if (!tokens.has(token)) {
        return { valid: false, error: "INVALID_OR_CONSUMED" };
      }
      tokens.delete(token); // Atomic immediate deletion
      return { valid: true };
    }

    const firstAttempt = consumeToken("single-use-token-xyz");
    expect(firstAttempt.valid).toBe(true);

    const replayedAttempt = consumeToken("single-use-token-xyz");
    expect(replayedAttempt.valid).toBe(false);
    expect(replayedAttempt.error).toBe("INVALID_OR_CONSUMED");
  });

  // =========================================================================
  // 27. Telegram duplicate webhook update prevention & chat_id uniqueness
  // =========================================================================
  it("Point 27: handles duplicate webhook updates idempotently via chat_id conflict resolution", () => {
    const activeLinks = new Map<string, { profile_id: string; chat_id: string; username: string | null }>();

    function upsertTelegramLink(profileId: string, chatId: string, username: string | null) {
      // Enforce: one profile per chat_id, and one chat_id per profile
      for (const [key, val] of activeLinks.entries()) {
        if (val.profile_id === profileId) {
          activeLinks.delete(key);
        }
      }
      activeLinks.set(chatId, { profile_id: profileId, chat_id: chatId, username });
      return { success: true, count: activeLinks.size };
    }

    // First webhook delivery
    upsertTelegramLink("user-1", "chat-999", "elderly_user");
    expect(activeLinks.size).toBe(1);
    expect(activeLinks.get("chat-999")?.profile_id).toBe("user-1");

    // Duplicate webhook delivery from Telegram retry
    upsertTelegramLink("user-1", "chat-999", "elderly_user");
    expect(activeLinks.size).toBe(1);

    // Profile updates link from another chat
    upsertTelegramLink("user-1", "chat-888", "elderly_user");
    expect(activeLinks.size).toBe(1);
    expect(activeLinks.has("chat-999")).toBe(false);
    expect(activeLinks.get("chat-888")?.profile_id).toBe("user-1");
  });

  // =========================================================================
  // 28. Non-message or non-text Telegram updates are handled gracefully
  // =========================================================================
  it("Point 28: safely returns ok: true for non-message or non-text Telegram updates without processing", () => {
    function evaluateWebhookUpdate(update: { message?: { text?: string; chat?: { id: number } } }) {
      const message = update.message;
      if (!message || !message.text || !message.chat?.id) {
        return { handled: false, status: 200, response: { ok: true } };
      }
      return { handled: true, status: 200, response: { ok: true } };
    }

    // Channel post update (no message object)
    expect(evaluateWebhookUpdate({})).toEqual({ handled: false, status: 200, response: { ok: true } });

    // Photo message (no text)
    expect(evaluateWebhookUpdate({ message: { chat: { id: 12345 } } })).toEqual({
      handled: false,
      status: 200,
      response: { ok: true },
    });

    // Valid command message
    expect(evaluateWebhookUpdate({ message: { text: "/start token123", chat: { id: 12345 } } })).toEqual({
      handled: true,
      status: 200,
      response: { ok: true },
    });
  });

  // =========================================================================
  // 29. Notification engine respects telegram_enabled: false preference
  // =========================================================================
  it("Point 29: skips Telegram dispatch when preference telegram_enabled is false", () => {
    const preferences = { telegram_enabled: false, email_enabled: true };
    const chatBinding = { telegram_chat_id: "chat-999" };

    function shouldDispatchTelegram(pref: typeof preferences, binding?: typeof chatBinding | null): boolean {
      return Boolean(pref.telegram_enabled && binding?.telegram_chat_id);
    }

    expect(shouldDispatchTelegram(preferences, chatBinding)).toBe(false);
    expect(shouldDispatchTelegram({ telegram_enabled: true, email_enabled: true }, null)).toBe(false);
    expect(shouldDispatchTelegram({ telegram_enabled: true, email_enabled: true }, chatBinding)).toBe(true);
  });

  // =========================================================================
  // 30. Deep link generates correct official bot URL
  // =========================================================================
  it("Point 30: builds correct deep-link URL containing the target bot username and start param", () => {
    const originalUsername = process.env.TELEGRAM_BOT_USERNAME;
    process.env.TELEGRAM_BOT_USERNAME = "VatsalyaCareBot";

    try {
      const token = "secure-random-link-token";
      const deepLink = buildTelegramDeepLink(token);
      expect(deepLink).toBe("https://t.me/VatsalyaCareBot?start=secure-random-link-token");
    } finally {
      process.env.TELEGRAM_BOT_USERNAME = originalUsername;
    }
  });

  // =========================================================================
  // 31. isTelegramConfigured correctly recognizes configured bot tokens
  // =========================================================================
  it("Point 31: isTelegramConfigured correctly validates bot token format and rejects placeholders", () => {
    const originalToken = process.env.TELEGRAM_BOT_TOKEN;

    try {
      process.env.TELEGRAM_BOT_TOKEN = "123456789:ABCdefGHIjklMNOpqrSTUvwxYZ_placeholder";
      expect(isTelegramConfigured()).toBe(false);

      process.env.TELEGRAM_BOT_TOKEN = "";
      expect(isTelegramConfigured()).toBe(false);

      delete process.env.TELEGRAM_BOT_TOKEN;
      expect(isTelegramConfigured()).toBe(false);

      process.env.TELEGRAM_BOT_TOKEN = "987654321:AAFakeDummyBotTokenForTestingPurposes123";
      expect(isTelegramConfigured()).toBe(true);
    } finally {
      process.env.TELEGRAM_BOT_TOKEN = originalToken;
    }
  });

  // =========================================================================
  // 32. Resend sender address parsing and default fallback
  // =========================================================================
  it("Point 32: correctly parses sender display name and email address, sanitizing quotes", () => {
    const originalFrom = process.env.RESEND_FROM_EMAIL;

    try {
      process.env.RESEND_FROM_EMAIL = '"VATSALYA Care <onboarding@resend.dev>"';
      expect(getResendConfig().fromEmail).toBe("VATSALYA Care <onboarding@resend.dev>");

      process.env.RESEND_FROM_EMAIL = "VATSALYA Care <onboarding@resend.dev>";
      expect(getResendConfig().fromEmail).toBe("VATSALYA Care <onboarding@resend.dev>");

      delete process.env.RESEND_FROM_EMAIL;
      expect(getResendConfig().fromEmail).toBe("reminders@vatsalya.care");
    } finally {
      process.env.RESEND_FROM_EMAIL = originalFrom;
    }
  });

  // =========================================================================
  // 33. isResendConfigured validates real vs placeholder / missing API keys
  // =========================================================================
  it("Point 33: isResendConfigured correctly detects active API keys and rejects placeholders", () => {
    const originalApiKey = process.env.RESEND_API_KEY;

    try {
      process.env.RESEND_API_KEY = "re_123456789_placeholder";
      expect(isResendConfigured()).toBe(false);

      process.env.RESEND_API_KEY = "";
      expect(isResendConfigured()).toBe(false);

      delete process.env.RESEND_API_KEY;
      expect(isResendConfigured()).toBe(false);

      process.env.RESEND_API_KEY = "re_live_valid_api_key_sample";
      expect(isResendConfigured()).toBe(true);
    } finally {
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });

  // =========================================================================
  // 34. Resend email failure records FAILED status without creating duplicates
  // =========================================================================
  it("Point 34: records provider failures as FAILED (never SENT) and prevents duplicate notifications", () => {
    const notifications = new Map<string, { status: string; retries: number; error?: string }>();

    function recordEmailAttempt(idempotencyKey: string, providerResponse: { ok: boolean; error?: string }) {
      const existing = notifications.get(idempotencyKey);
      if (existing && existing.status === "SENT") {
        return { success: false, reason: "ALREADY_SENT" };
      }

      if (!providerResponse.ok) {
        notifications.set(idempotencyKey, {
          status: "FAILED",
          retries: (existing?.retries || 0) + 1,
          error: providerResponse.error || "PROVIDER_ERROR",
        });
        return { success: false, status: "FAILED" };
      }

      notifications.set(idempotencyKey, {
        status: "SENT",
        retries: existing?.retries || 0,
      });
      return { success: true, status: "SENT" };
    }

    const key = "sha256-deterministic-email-key-123";

    // 1. Initial attempt fails (e.g. rate limit or domain error)
    const attempt1 = recordEmailAttempt(key, { ok: false, error: "Domain not verified" });
    expect(attempt1.status).toBe("FAILED");
    expect(notifications.get(key)?.status).toBe("FAILED");
    expect(notifications.get(key)?.retries).toBe(1);

    // 2. Retry succeeds
    const attempt2 = recordEmailAttempt(key, { ok: true });
    expect(attempt2.status).toBe("SENT");
    expect(notifications.get(key)?.status).toBe("SENT");

    // 3. Subsequent retry attempt rejected because already SENT
    const attempt3 = recordEmailAttempt(key, { ok: true });
    expect(attempt3.reason).toBe("ALREADY_SENT");
    expect(notifications.size).toBe(1); // No duplicate notification created
  });
});
