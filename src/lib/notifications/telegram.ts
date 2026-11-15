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

/**
 * Sends a message via the official Telegram Bot API.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options: { parseMode?: "HTML" | "Markdown" } = { parseMode: "HTML" }
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
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: options.parseMode || "HTML",
        disable_web_page_preview: true,
      }),
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
