import crypto from "node:crypto";

/**
 * Generates a cryptographically secure, high-entropy, short-lived linking token.
 * 24 bytes base64url-encoded produces 32 URL-safe characters.
 */
export function generateTelegramLinkingToken(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/**
 * Calculates linking token expiration (default: 15 minutes).
 */
export function calculateTokenExpiration(ttlMinutes: number = 15): Date {
  return new Date(Date.now() + ttlMinutes * 60 * 1000);
}

/**
 * Validates whether a token has expired.
 */
export function isTokenExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === "string" ? new Date(expiresAt) : expiresAt;
  return Date.now() > expiry.getTime();
}

/**
 * Computes deterministic SHA-256 idempotency keys.
 * Strict Security Rule: Never use MD5 for idempotency or cryptographic hashing.
 */
export function generateNotificationIdempotencyKey(parts: string[]): string {
  const raw = parts.join(":");
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}
