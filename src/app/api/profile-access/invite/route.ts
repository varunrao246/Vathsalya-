import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generatePasscode, hashPasscode } from "@/lib/security/passcode";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const {
      healthcareProfileId,
      invitedRole,
      canManageMeds = false,
      canConfirmDoses = true,
    } = body;

    if (!healthcareProfileId || !invitedRole) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "healthcareProfileId and invitedRole are required." } },
        { status: 400 }
      );
    }

    if (!["FAMILY_ADMIN", "FAMILY_VIEWER", "CARETAKER"].includes(invitedRole)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_ROLE", message: "Role must be FAMILY_ADMIN, FAMILY_VIEWER, or CARETAKER." } },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify caller is Owner or Family Admin
    const { data: member, error: memberError } = await supabase
      .from("profile_access_members")
      .select("role")
      .eq("healthcare_profile_id", healthcareProfileId)
      .eq("profile_id", user.id)
      .eq("status", "ACTIVE")
      .in("role", ["ELDERLY", "FAMILY_ADMIN"])
      .single();

    if (memberError || !member) {
      return NextResponse.json(
        { success: false, error: { code: "FORBIDDEN", message: "Only profile owners or family admins can generate access invitations." } },
        { status: 403 }
      );
    }

    // Generate cryptographic 6-digit passcode
    const rawPasscode = generatePasscode();
    const hashedCode = hashPasscode(rawPasscode);
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 hours TTL

    const { data: invitation, error: inviteError } = await supabase
      .from("profile_access_invitations")
      .insert({
        healthcare_profile_id: healthcareProfileId,
        created_by: user.id,
        hashed_code: hashedCode,
        invited_role: invitedRole,
        can_manage_meds: Boolean(canManageMeds),
        can_confirm_doses: Boolean(canConfirmDoses),
        expires_at: expiresAt,
        attempt_count: 0,
        max_attempts: 5,
      })
      .select("id, invited_role, expires_at, created_at")
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: inviteError?.message || "Failed to create invitation" } },
        { status: 500 }
      );
    }

    // Log audit activity
    await supabase.from("care_activities").insert({
      healthcare_profile_id: healthcareProfileId,
      actor_id: user.id,
      actor_role: member.role,
      action_type: "INVITATION_GENERATED",
      action_payload: { invitedRole, invitationId: invitation.id },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          invitationId: invitation.id,
          passcode: rawPasscode, // Shown strictly once at generation time
          invitedRole: invitation.invited_role,
          expiresAt: invitation.expires_at,
          instructions: "Share this 6-digit code with your family member or caretaker. It expires in 48 hours and can only be used once.",
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload" } },
      { status: 400 }
    );
  }
}
