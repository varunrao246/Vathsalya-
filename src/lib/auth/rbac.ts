export type Role = "ELDERLY" | "FAMILY_ADMIN" | "FAMILY_VIEWER" | "CARETAKER";

export type Permission =
  | "VIEW_HEALTHCARE_RECORDS"
  | "EDIT_PROFILE"
  | "MANAGE_MEDICATIONS"
  | "MANAGE_APPOINTMENTS"
  | "CONFIRM_DOSES"
  | "INVITE_MEMBERS"
  | "REVOKE_ACCESS"
  | "VIEW_ADHERENCE";

export interface MemberAccessContext {
  userId: string;
  healthcareProfileId: string;
  role: Role;
  canManageMeds?: boolean;
  canManageAppointments?: boolean;
  canConfirmDoses?: boolean;
  status: "ACTIVE" | "INVITED" | "SUSPENDED";
}

/**
 * Deterministic permission checker mirroring PostgreSQL RLS logic.
 */
export function evaluatePermission(
  context: MemberAccessContext,
  targetProfileId: string,
  permission: Permission
): { allowed: boolean; reason?: string } {
  // 1. Cross-profile access denial: Membership must match target healthcare profile
  if (context.healthcareProfileId !== targetProfileId) {
    return {
      allowed: false,
      reason: "CROSS_PROFILE_DENIAL: Caller does not belong to target healthcare profile.",
    };
  }

  // 2. Active status verification
  if (context.status !== "ACTIVE") {
    return {
      allowed: false,
      reason: "INACTIVE_STATUS: Membership is not active.",
    };
  }

  // 3. Permission checks per role
  switch (context.role) {
    case "ELDERLY":
      // Elderly Individual (Profile Owner): Full autonomy over own profile
      return { allowed: true };

    case "FAMILY_ADMIN":
      // Family Admin: Full operational management, except cannot revoke elderly owner
      return { allowed: true };

    case "FAMILY_VIEWER":
      // Read-only member
      if (
        permission === "VIEW_HEALTHCARE_RECORDS" ||
        permission === "VIEW_ADHERENCE"
      ) {
        return { allowed: true };
      }
      return {
        allowed: false,
        reason: "FAMILY_VIEWER: Read-only access permitted.",
      };

    case "CARETAKER":
      // Caretaker: Tasks and dose recording during assigned shifts
      if (permission === "VIEW_HEALTHCARE_RECORDS") {
        return { allowed: true };
      }
      if (permission === "CONFIRM_DOSES") {
        return {
          allowed: context.canConfirmDoses ?? true,
          reason: context.canConfirmDoses ? undefined : "Dose confirmation not granted.",
        };
      }
      if (permission === "MANAGE_MEDICATIONS") {
        return {
          allowed: context.canManageMeds ?? false,
          reason: context.canManageMeds ? undefined : "Medication management not granted to caretaker.",
        };
      }
      if (permission === "MANAGE_APPOINTMENTS") {
        return {
          allowed: context.canManageAppointments ?? false,
          reason: context.canManageAppointments ? undefined : "Appointment management not granted.",
        };
      }
      // Caretakers cannot invite or revoke access
      return {
        allowed: false,
        reason: "CARETAKER_RESTRICTION: Administrative actions forbidden.",
      };

    default:
      return { allowed: false, reason: "UNKNOWN_ROLE" };
  }
}
