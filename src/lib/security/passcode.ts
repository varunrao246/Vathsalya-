import crypto from "crypto";

const PASSCODE_SALT = process.env.CRON_SECRET || "vatsalya-passcode-salt-key-2026";

/**
 * Generate a cryptographically secure 6-digit numeric passcode (e.g. "849201")
 */
export function generatePasscode(): string {
  // Generates integer in range [100000, 999999]
  const code = crypto.randomInt(100000, 1000000);
  return code.toString();
}

/**
 * Hash passcode with HMAC-SHA256.
 * Plaintext passcode is never stored in the database.
 */
export function hashPasscode(passcode: string): string {
  const cleanCode = passcode.trim().replace(/\s+/g, "");
  return crypto.createHmac("sha256", PASSCODE_SALT).update(cleanCode).digest("hex");
}

/**
 * Constant-time comparison to prevent timing attacks.
 */
export function verifyPasscodeHash(submittedPasscode: string, storedHash: string): boolean {
  const submittedHash = hashPasscode(submittedPasscode);
  const bufA = Buffer.from(submittedHash, "hex");
  const bufB = Buffer.from(storedHash, "hex");

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Evaluate whether an invitation passcode is active and redeemable.
 */
export interface InvitationValidationResult {
  valid: boolean;
  reason?: "EXPIRED" | "ALREADY_USED" | "REVOKED" | "MAX_ATTEMPTS_EXCEEDED" | "INVALID_CODE";
}

export function validateInvitationStatus(invitation: {
  expires_at: string;
  used_at: string | null;
  revoked_at: string | null;
  attempt_count: number;
  max_attempts: number;
}): InvitationValidationResult {
  if (invitation.revoked_at) {
    return { valid: false, reason: "REVOKED" };
  }

  if (invitation.used_at) {
    return { valid: false, reason: "ALREADY_USED" };
  }

  if (invitation.attempt_count >= invitation.max_attempts) {
    return { valid: false, reason: "MAX_ATTEMPTS_EXCEEDED" };
  }

  const now = new Date();
  const expiry = new Date(invitation.expires_at);
  if (now > expiry) {
    return { valid: false, reason: "EXPIRED" };
  }

  return { valid: true };
}
