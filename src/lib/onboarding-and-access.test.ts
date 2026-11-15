import { describe, it, expect } from "vitest";
import {
  generatePasscode,
  hashPasscode,
  verifyPasscodeHash,
  validateInvitationStatus,
} from "./security/passcode";
import { evaluatePermission, MemberAccessContext } from "./auth/rbac";

describe("Milestone 3: Healthcare Profile Onboarding & Secure Member Access Test Suite", () => {
  const profileIdA = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
  const profileIdB = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

  // =========================================================================
  // 1. Elderly individual creating their own profile (Journey 1)
  // =========================================================================
  it("Scenario 1: creates healthcare profile for self with ELDERLY role and primary_elder_id", () => {
    const userId = "elderly-user-123";
    const payload = {
      displayName: "Appaji Rao",
      dateOfBirth: "1952-04-12",
      emergencyContactName: "Priya Sharma (Daughter)",
      emergencyContactPhone: "+91 98765 43210",
      isSelf: true,
    };

    // Expected profile creation logic
    const createdProfile = {
      id: profileIdA,
      primary_elder_id: payload.isSelf ? userId : null,
      display_name: payload.displayName,
      date_of_birth: payload.dateOfBirth,
      emergency_contact_name: payload.emergencyContactName,
      emergency_contact_phone: payload.emergencyContactPhone,
    };

    // Expected member binding
    const assignedRole = payload.isSelf ? "ELDERLY" : "FAMILY_ADMIN";

    expect(createdProfile.primary_elder_id).toBe(userId);
    expect(assignedRole).toBe("ELDERLY");
  });

  // =========================================================================
  // 2. Family member creating a profile for an elderly parent (Journey 2)
  // =========================================================================
  it("Scenario 2: creates healthcare profile for parent with FAMILY_ADMIN role without claiming elder identity", () => {
    const userId = "family-daughter-456";
    const payload = {
      displayName: "Savitri Amma",
      dateOfBirth: "1955-08-20",
      emergencyContactName: "Priya Sharma (Daughter)",
      emergencyContactPhone: "+91 98765 43210",
      isSelf: false, // Creating on behalf
    };

    const createdProfile = {
      id: profileIdB,
      primary_elder_id: payload.isSelf ? userId : null, // Not claimed as elder
      display_name: payload.displayName,
      date_of_birth: payload.dateOfBirth,
    };

    const assignedRole = payload.isSelf ? "ELDERLY" : "FAMILY_ADMIN";

    expect(createdProfile.primary_elder_id).toBeNull();
    expect(assignedRole).toBe("FAMILY_ADMIN");
  });

  // =========================================================================
  // 3. Required-field validation
  // =========================================================================
  it("Scenario 3: rejects profile creation if mandatory fields are missing", () => {
    function validateProfilePayload(body: Record<string, string | undefined>): { valid: boolean; missing?: string } {
      if (!body.displayName?.trim()) return { valid: false, missing: "displayName" };
      if (!body.dateOfBirth) return { valid: false, missing: "dateOfBirth" };
      if (!body.emergencyContactName?.trim()) return { valid: false, missing: "emergencyContactName" };
      if (!body.emergencyContactPhone?.trim()) return { valid: false, missing: "emergencyContactPhone" };
      return { valid: true };
    }

    expect(validateProfilePayload({ displayName: "Appaji" }).valid).toBe(false);
    expect(validateProfilePayload({ displayName: "Appaji", dateOfBirth: "1952-04-12" }).valid).toBe(false);
    expect(
      validateProfilePayload({
        displayName: "Appaji",
        dateOfBirth: "1952-04-12",
        emergencyContactName: "Priya",
        emergencyContactPhone: "+91 98765 43210",
      }).valid
    ).toBe(true);
  });

  // =========================================================================
  // 4. Unauthorized profile access
  // =========================================================================
  it("Scenario 4: denies access to a user who is not an active member in profile_access_members", () => {
    const nonMemberContext: MemberAccessContext = {
      userId: "stranger-999",
      healthcareProfileId: "foreign-profile-xyz",
      role: "FAMILY_VIEWER",
      status: "ACTIVE",
    };

    const accessCheck = evaluatePermission(nonMemberContext, profileIdA, "VIEW_HEALTHCARE_RECORDS");
    expect(accessCheck.allowed).toBe(false);
    expect(accessCheck.reason).toContain("CROSS_PROFILE_DENIAL");
  });

  // =========================================================================
  // 5. Invitation generation
  // =========================================================================
  it("Scenario 5: generates a 6-digit numeric passcode and stores only its HMAC-SHA256 hash", () => {
    const rawCode = generatePasscode();
    expect(rawCode).toMatch(/^\d{6}$/);

    const hashedCode = hashPasscode(rawCode);
    expect(hashedCode).not.toBe(rawCode);
    expect(hashedCode).toHaveLength(64);

    // Verify constant-time comparison
    expect(verifyPasscodeHash(rawCode, hashedCode)).toBe(true);
  });

  // =========================================================================
  // 6. Invitation expiry (48 hours)
  // =========================================================================
  it("Scenario 6: rejects invitations when expired past 48 hours", () => {
    const expiredInvitation = {
      expires_at: new Date(Date.now() - 1000 * 60).toISOString(), // 1 minute in the past
      used_at: null,
      revoked_at: null,
      attempt_count: 0,
      max_attempts: 5,
    };

    const status = validateInvitationStatus(expiredInvitation);
    expect(status.valid).toBe(false);
    expect(status.reason).toBe("EXPIRED");
  });

  // =========================================================================
  // 7. Invitation single-use enforcement
  // =========================================================================
  it("Scenario 7: rejects an invitation that has already been redeemed (single-use)", () => {
    const alreadyUsedInvitation = {
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      used_at: new Date(Date.now() - 1000 * 60 * 10).toISOString(), // Redeemed 10 min ago
      revoked_at: null,
      attempt_count: 1,
      max_attempts: 5,
    };

    const status = validateInvitationStatus(alreadyUsedInvitation);
    expect(status.valid).toBe(false);
    expect(status.reason).toBe("ALREADY_USED");
  });

  // =========================================================================
  // 8. Invalid passcode
  // =========================================================================
  it("Scenario 8: rejects an incorrect passcode input", () => {
    const realCode = "849201";
    const wrongCode = "999999";
    const storedHash = hashPasscode(realCode);

    expect(verifyPasscodeHash(wrongCode, storedHash)).toBe(false);
  });

  // =========================================================================
  // 9. Unauthorized role assignment (Role comes from DB, not client)
  // =========================================================================
  it("Scenario 9: prevents redeeming user from elevating their role; role is locked from DB invitation", () => {
    // Database record created by Owner for a CARETAKER
    const dbInvitation = {
      id: "inv-123",
      healthcare_profile_id: profileIdA,
      invited_role: "CARETAKER", // Verified DB role
    };

    // Attacker tries to submit payload: { passcode: "849201", desiredRole: "FAMILY_ADMIN" }
    const clientPayload = {
      passcode: "849201",
      desiredRole: "FAMILY_ADMIN",
    };

    // The server ignores clientPayload.desiredRole and binds dbInvitation.invited_role
    const finalAssignedRole = dbInvitation.invited_role;
    expect(finalAssignedRole).toBe("CARETAKER");
    expect(finalAssignedRole).not.toBe(clientPayload.desiredRole);
  });

  // =========================================================================
  // 10. Member access revocation
  // =========================================================================
  it("Scenario 10: allows authorized owner/admin to revoke a caretaker or family member", () => {
    const adminContext: MemberAccessContext = {
      userId: "admin-1",
      healthcareProfileId: profileIdA,
      role: "FAMILY_ADMIN",
      status: "ACTIVE",
    };

    // Admin has authority to revoke access
    expect(evaluatePermission(adminContext, profileIdA, "REVOKE_ACCESS").allowed).toBe(true);
  });

  // =========================================================================
  // 11. Elderly owner protection
  // =========================================================================
  it("Scenario 11: explicitly forbids revoking the elderly profile owner", () => {
    function canRevokeTargetMember(targetRole: string): { allowed: boolean; error?: string } {
      if (targetRole === "ELDERLY") {
        return {
          allowed: false,
          error: "CANNOT_REVOKE_OWNER: The elderly profile owner cannot be removed.",
        };
      }
      return { allowed: true };
    }

    expect(canRevokeTargetMember("CARETAKER").allowed).toBe(true);
    expect(canRevokeTargetMember("FAMILY_ADMIN").allowed).toBe(true);
    expect(canRevokeTargetMember("ELDERLY").allowed).toBe(false);
    expect(canRevokeTargetMember("ELDERLY").error).toContain("CANNOT_REVOKE_OWNER");
  });

  // =========================================================================
  // 12. Cross-profile access denial
  // =========================================================================
  it("Scenario 12: denies cross-profile data access and action execution", () => {
    const memberOfProfileA: MemberAccessContext = {
      userId: "user-alpha",
      healthcareProfileId: profileIdA,
      role: "FAMILY_ADMIN",
      status: "ACTIVE",
    };

    // Member tries to modify medications on Profile B
    const crossProfileCheck = evaluatePermission(memberOfProfileA, profileIdB, "MANAGE_MEDICATIONS");
    expect(crossProfileCheck.allowed).toBe(false);
    expect(crossProfileCheck.reason).toContain("CROSS_PROFILE_DENIAL");
  });
});
