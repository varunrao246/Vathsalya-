import { describe, it, expect } from "vitest";
import {
  generatePasscode,
  hashPasscode,
  verifyPasscodeHash,
  validateInvitationStatus,
} from "./passcode";

describe("Secure Passcode Generation & Verification", () => {
  it("generates a 6-digit numeric string", () => {
    const code = generatePasscode();
    expect(code).toMatch(/^\d{6}$/);
    const num = parseInt(code, 10);
    expect(num).toBeGreaterThanOrEqual(100000);
    expect(num).toBeLessThan(1000000);
  });

  it("produces deterministic HMAC-SHA256 hashes for identical codes", () => {
    const code = "849201";
    const hash1 = hashPasscode(code);
    const hash2 = hashPasscode(code);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
  });

  it("fails verification for incorrect passcode", () => {
    const code = "849201";
    const hash = hashPasscode(code);
    expect(verifyPasscodeHash("849201", hash)).toBe(true);
    expect(verifyPasscodeHash("123456", hash)).toBe(false);
  });

  it("normalizes whitespace during passcode hashing", () => {
    const hash1 = hashPasscode("8 4 9 2 0 1");
    const hash2 = hashPasscode("849201");
    expect(hash1).toBe(hash2);
  });
});

describe("Invitation Status & Expiry Validation", () => {
  const baseInvitation = {
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24h future
    used_at: null,
    revoked_at: null,
    attempt_count: 0,
    max_attempts: 5,
  };

  it("validates an active, unexpired, unused invitation", () => {
    const result = validateInvitationStatus(baseInvitation);
    expect(result.valid).toBe(true);
  });

  it("rejects an expired passcode (>48 hours)", () => {
    const expiredInvitation = {
      ...baseInvitation,
      expires_at: new Date(Date.now() - 1000 * 60 * 60).toISOString(), // 1h ago
    };
    const result = validateInvitationStatus(expiredInvitation);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("EXPIRED");
  });

  it("rejects an already-used passcode (single-use constraint)", () => {
    const usedInvitation = {
      ...baseInvitation,
      used_at: new Date(Date.now() - 1000 * 60).toISOString(),
    };
    const result = validateInvitationStatus(usedInvitation);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("ALREADY_USED");
  });

  it("rejects a revoked passcode", () => {
    const revokedInvitation = {
      ...baseInvitation,
      revoked_at: new Date(Date.now() - 1000 * 60).toISOString(),
    };
    const result = validateInvitationStatus(revokedInvitation);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("REVOKED");
  });

  it("rejects when maximum failed attempts are exceeded (brute-force lockout)", () => {
    const lockedInvitation = {
      ...baseInvitation,
      attempt_count: 5,
      max_attempts: 5,
    };
    const result = validateInvitationStatus(lockedInvitation);
    expect(result.valid).toBe(false);
    expect(result.reason).toBe("MAX_ATTEMPTS_EXCEEDED");
  });
});
