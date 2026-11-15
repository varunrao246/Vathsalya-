import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const healthcareProfileId = searchParams.get("healthcareProfileId");

  if (!healthcareProfileId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "healthcareProfileId is required." } },
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
      { success: false, error: { code: "FORBIDDEN", message: "Only profile owners or family admins can view invitations." } },
      { status: 403 }
    );
  }

  // Fetch invitations for this profile
  const { data: invitations, error: inviteError } = await supabase
    .from("profile_access_invitations")
    .select("id, invited_role, can_manage_meds, can_confirm_doses, attempt_count, max_attempts, expires_at, used_at, used_by, revoked_at, created_at")
    .eq("healthcare_profile_id", healthcareProfileId)
    .order("created_at", { ascending: false });

  if (inviteError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: inviteError.message } },
      { status: 500 }
    );
  }

  const now = new Date();
  const formattedInvitations = (invitations || []).map((inv) => {
    let status: "PENDING" | "REDEEMED" | "EXPIRED" | "REVOKED" = "PENDING";
    if (inv.revoked_at) {
      status = "REVOKED";
    } else if (inv.used_at) {
      status = "REDEEMED";
    } else if (new Date(inv.expires_at) < now || inv.attempt_count >= inv.max_attempts) {
      status = "EXPIRED";
    }

    return {
      id: inv.id,
      invitedRole: inv.invited_role,
      canManageMeds: inv.can_manage_meds,
      canConfirmDoses: inv.can_confirm_doses,
      expiresAt: inv.expires_at,
      status,
      usedAt: inv.used_at,
      revokedAt: inv.revoked_at,
      createdAt: inv.created_at,
    };
  });

  return NextResponse.json({ success: true, data: formattedInvitations }, { status: 200 });
}
