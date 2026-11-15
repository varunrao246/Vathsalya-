import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { hashPasscode, validateInvitationStatus } from "@/lib/security/passcode";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "You must be signed in to redeem an access passcode." } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { passcode } = body;

    if (!passcode || typeof passcode !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "A 6-digit passcode is required." } },
        { status: 400 }
      );
    }

    const cleanPasscode = passcode.trim().replace(/\s+/g, "");
    if (!/^\d{6}$/.test(cleanPasscode)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_FORMAT", message: "Passcode must be exactly 6 digits." } },
        { status: 400 }
      );
    }

    const hashedCode = hashPasscode(cleanPasscode);
    const supabase = await createServerSupabaseClient();

    // Query invitation by hash
    const { data: invitation, error: inviteError } = await supabase
      .from("profile_access_invitations")
      .select("id, healthcare_profile_id, invited_role, can_manage_meds, can_confirm_doses, expires_at, used_at, revoked_at, attempt_count, max_attempts")
      .eq("hashed_code", hashedCode)
      .single();

    if (inviteError || !invitation) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PASSCODE", message: "Invalid or nonexistent passcode." } },
        { status: 400 }
      );
    }

    // Validate expiration, prior use, revocation, and rate limiting
    const validation = validateInvitationStatus(invitation);
    if (!validation.valid) {
      // Increment attempt count on failed attempt
      await supabase
        .from("profile_access_invitations")
        .update({ attempt_count: invitation.attempt_count + 1 })
        .eq("id", invitation.id);

      const errorMessages: Record<string, string> = {
        EXPIRED: "This passcode expired 48 hours after generation. Please request a new code.",
        ALREADY_USED: "This single-use passcode has already been redeemed.",
        REVOKED: "This passcode was revoked by the healthcare profile administrator.",
        MAX_ATTEMPTS_EXCEEDED: "Too many failed attempts. This passcode is now locked.",
      };

      return NextResponse.json(
        {
          success: false,
          error: {
            code: validation.reason || "INVALID_PASSCODE",
            message: errorMessages[validation.reason || ""] || "Passcode is not valid.",
          },
        },
        { status: 400 }
      );
    }

    // Insert user into profile_access_members (using the verified role from the DB)
    const { data: member, error: memberError } = await supabase
      .from("profile_access_members")
      .upsert(
        {
          healthcare_profile_id: invitation.healthcare_profile_id,
          profile_id: user.id,
          role: invitation.invited_role,
          can_manage_meds: invitation.can_manage_meds,
          can_manage_appointments: false,
          can_confirm_doses: invitation.can_confirm_doses,
          status: "ACTIVE",
          joined_at: new Date().toISOString(),
        },
        { onConflict: "healthcare_profile_id,profile_id" }
      )
      .select()
      .single();

    if (memberError) {
      return NextResponse.json(
        { success: false, error: { code: "MEMBER_JOIN_ERROR", message: memberError.message } },
        { status: 500 }
      );
    }

    // Mark invitation as permanently used (single-use redemption)
    await supabase
      .from("profile_access_invitations")
      .update({
        used_at: new Date().toISOString(),
        used_by: user.id,
      })
      .eq("id", invitation.id);

    // Fetch healthcare profile display name
    const { data: profile } = await supabase
      .from("healthcare_profiles")
      .select("display_name")
      .eq("id", invitation.healthcare_profile_id)
      .single();

    // Log immutable audit activity
    await supabase.from("care_activities").insert({
      healthcare_profile_id: invitation.healthcare_profile_id,
      actor_id: user.id,
      actor_role: invitation.invited_role,
      action_type: "MEMBER_JOINED_VIA_PASSCODE",
      action_payload: {
        role: invitation.invited_role,
        invitationId: invitation.id,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          healthcareProfileId: invitation.healthcare_profile_id,
          displayName: profile?.display_name || "Healthcare Profile",
          assignedRole: invitation.invited_role,
          joinedAt: member.joined_at,
        },
      },
      { status: 200 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload" } },
      { status: 400 }
    );
  }
}
