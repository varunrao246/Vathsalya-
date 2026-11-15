import crypto from "node:crypto";
import { DispatchResult } from "./types";

export interface TelegramConfig {
  botToken?: string;
  webhookSecret?: string;
  botUsername?: string;
}

export function getTelegramConfig(): TelegramConfig {
  return {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET,
    botUsername: process.env.TELEGRAM_BOT_USERNAME || "VatsalyaCareBot",
  };
}

export function isTelegramConfigured(): boolean {
  const { botToken } = getTelegramConfig();
  return Boolean(
    botToken &&
      botToken !== "undefined" &&
      !botToken.includes("placeholder") &&
      !botToken.startsWith("123456789:")
  );
}

/**
 * Builds the official Telegram bot deep-link for secure account linking.
 */
export function buildTelegramDeepLink(token: string): string {
  const { botUsername } = getTelegramConfig();
  return `https://t.me/${botUsername}?start=${encodeURIComponent(token)}`;
}

/**
 * Verifies the incoming webhook header against configured TELEGRAM_WEBHOOK_SECRET.
 * Uses timingSafeEqual to protect against timing attacks.
 */
export function verifyTelegramWebhookSecret(
  headerSecret: string | null | undefined
): boolean {
  const { webhookSecret } = getTelegramConfig();
  if (!webhookSecret || !headerSecret) {
    return false;
  }

  const expected = Buffer.from(webhookSecret, "utf8");
  const provided = Buffer.from(headerSecret, "utf8");

  if (expected.length !== provided.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, provided);
}

export interface TelegramInlineButton {
  text: string;
  callback_data: string;
}

export interface TelegramReplyMarkup {
  inline_keyboard?: TelegramInlineButton[][];
}

/**
 * Sends a message via the official Telegram Bot API with optional inline buttons.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: {
    parseMode?: "HTML" | "Markdown";
    replyMarkup?: TelegramReplyMarkup;
  } = { parseMode: "HTML" }
): Promise<DispatchResult> {
  const { botToken } = getTelegramConfig();

  if (!isTelegramConfigured() || !botToken) {
    return {
      success: false,
      channel: "TELEGRAM",
      error: "TELEGRAM_NOT_CONFIGURED: Live Telegram Bot token is not configured in environment.",
    };
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const body: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: options.parseMode || "HTML",
      disable_web_page_preview: true,
    };

    if (options.replyMarkup) {
      body.reply_markup = options.replyMarkup;
    }

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok || !data.ok) {
      return {
        success: false,
        channel: "TELEGRAM",
        error: data.description || `HTTP_${res.status}: Failed to send Telegram message.`,
      };
    }

    return {
      success: true,
      channel: "TELEGRAM",
      providerMessageId: String(data.result?.message_id || ""),
    };
  } catch (err: unknown) {
    return {
      success: false,
      channel: "TELEGRAM",
      error: err instanceof Error ? err.message : "NETWORK_ERROR",
    };
  }
}

/**
 * Answers a Telegram callback query from an inline button tap.
 */
export async function answerTelegramCallbackQuery(
  callbackQueryId: string,
  text?: string,
  showAlert = false
): Promise<boolean> {
  const { botToken } = getTelegramConfig();
  if (!botToken) return false;

  try {
    const url = `https://api.telegram.org/bot${botToken}/answerCallbackQuery`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callback_query_id: callbackQueryId,
        text,
        show_alert: showAlert,
      }),
    });
    const json = await res.json();
    return Boolean(json.ok);
  } catch (err) {
    console.error("[Telegram] answerCallbackQuery failed:", err);
    return false;
  }
}

/**
 * Sends a structured medication reminder with required inline action buttons.
 */
export async function sendMedicationReminderMessage(
  chatId: string,
  details: {
    elderlyName: string;
    medName: string;
    dosageStrength: string;
    targetTime: string;
    instructions?: string | null;
    occurrenceKey: string;
  }
): Promise<DispatchResult> {
  const messageText = `<b>ನಮಸ್ಕಾರ ${details.elderlyName}!</b>\n\nIt is time for your scheduled medication:\n💊 <b>${details.medName} (${details.dosageStrength})</b>\n⏰ Scheduled: <b>${details.targetTime}</b>\n${details.instructions ? `📝 Note: <i>${details.instructions}</i>\n` : ""}\nPlease confirm after taking your medicine:`;

  const replyMarkup: TelegramReplyMarkup = {
    inline_keyboard: [
      [
        { text: "✅ TAKEN", callback_data: `TAKEN:${details.occurrenceKey}` },
        { text: "⏰ REMIND IN 15M", callback_data: `SNOOZE:${details.occurrenceKey}` },
      ],
      [
        { text: "🆘 NEED HELP", callback_data: `HELP:${details.occurrenceKey}` },
      ],
    ],
  };

  return sendTelegramMessage(chatId, messageText, {
    parseMode: "HTML",
    replyMarkup,
  });
}
