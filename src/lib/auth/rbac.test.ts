import { describe, it, expect } from "vitest";
import { evaluatePermission, MemberAccessContext } from "./rbac";

describe("Role-Based Access Control (RBAC) & Cross-Profile Security", () => {
  const profileIdA = "11111111-1111-1111-1111-111111111111";
  const profileIdB = "22222222-2222-2222-2222-222222222222";

  const elderlyContext: MemberAccessContext = {
    userId: "user-elderly-1",
    healthcareProfileId: profileIdA,
    role: "ELDERLY",
    status: "ACTIVE",
  };

  const familyAdminContext: MemberAccessContext = {
    userId: "user-family-admin-1",
    healthcareProfileId: profileIdA,
    role: "FAMILY_ADMIN",
    status: "ACTIVE",
  };

  const familyViewerContext: MemberAccessContext = {
    userId: "user-family-viewer-1",
    healthcareProfileId: profileIdA,
    role: "FAMILY_VIEWER",
    status: "ACTIVE",
  };

  const caretakerContext: MemberAccessContext = {
    userId: "user-caretaker-1",
    healthcareProfileId: profileIdA,
    role: "CARETAKER",
    canConfirmDoses: true,
    canManageMeds: false,
    status: "ACTIVE",
  };

  it("denies access when a user attempts to access a different healthcare profile (Cross-Profile Protection)", () => {
    // Caretaker belonging to Profile A tries to access Profile B
    const result = evaluatePermission(caretakerContext, profileIdB, "VIEW_HEALTHCARE_RECORDS");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("CROSS_PROFILE_DENIAL");
  });

  it("grants Elderly owner full autonomy on own profile", () => {
    expect(evaluatePermission(elderlyContext, profileIdA, "VIEW_HEALTHCARE_RECORDS").allowed).toBe(true);
    expect(evaluatePermission(elderlyContext, profileIdA, "CONFIRM_DOSES").allowed).toBe(true);
    expect(evaluatePermission(elderlyContext, profileIdA, "MANAGE_MEDICATIONS").allowed).toBe(true);
    expect(evaluatePermission(elderlyContext, profileIdA, "INVITE_MEMBERS").allowed).toBe(true);
  });

  it("allows Family Admin to manage medications and invite members", () => {
    expect(evaluatePermission(familyAdminContext, profileIdA, "MANAGE_MEDICATIONS").allowed).toBe(true);
    expect(evaluatePermission(familyAdminContext, profileIdA, "INVITE_MEMBERS").allowed).toBe(true);
    expect(evaluatePermission(familyAdminContext, profileIdA, "MANAGE_APPOINTMENTS").allowed).toBe(true);
  });

  it("restricts Family Viewer to read-only permissions", () => {
    expect(evaluatePermission(familyViewerContext, profileIdA, "VIEW_HEALTHCARE_RECORDS").allowed).toBe(true);
    expect(evaluatePermission(familyViewerContext, profileIdA, "VIEW_ADHERENCE").allowed).toBe(true);

    // Write permissions rejected
    expect(evaluatePermission(familyViewerContext, profileIdA, "MANAGE_MEDICATIONS").allowed).toBe(false);
    expect(evaluatePermission(familyViewerContext, profileIdA, "INVITE_MEMBERS").allowed).toBe(false);
  });

  it("permits Caretaker to confirm doses but forbids managing medication schedules by default", () => {
    expect(evaluatePermission(caretakerContext, profileIdA, "CONFIRM_DOSES").allowed).toBe(true);
    expect(evaluatePermission(caretakerContext, profileIdA, "MANAGE_MEDICATIONS").allowed).toBe(false);
    expect(evaluatePermission(caretakerContext, profileIdA, "INVITE_MEMBERS").allowed).toBe(false);
  });

  it("rejects all actions if member status is SUSPENDED", () => {
    const suspendedContext: MemberAccessContext = {
      ...familyAdminContext,
      status: "SUSPENDED",
    };
    const result = evaluatePermission(suspendedContext, profileIdA, "VIEW_HEALTHCARE_RECORDS");
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain("INACTIVE_STATUS");
  });
});
