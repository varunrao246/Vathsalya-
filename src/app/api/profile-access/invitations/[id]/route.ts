import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id } = await context.params;

  const supabase = await createServerSupabaseClient();

  // Find invitation to get healthcare_profile_id
  const { data: invitation, error: findError } = await supabase
    .from("profile_access_invitations")
    .select("id, healthcare_profile_id, invited_role, revoked_at, used_at")
    .eq("id", id)
    .single();

  if (findError || !invitation) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Invitation not found." } },
      { status: 404 }
    );
  }

  // Verify caller is Owner or Family Admin
  const { data: member, error: memberError } = await supabase
    .from("profile_access_members")
    .select("role")
    .eq("healthcare_profile_id", invitation.healthcare_profile_id)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .in("role", ["ELDERLY", "FAMILY_ADMIN"])
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only profile owners or family admins can revoke invitations." } },
      { status: 403 }
    );
  }

  if (invitation.used_at) {
    return NextResponse.json(
      { success: false, error: { code: "CANNOT_REVOKE", message: "Cannot revoke an invitation that has already been redeemed." } },
      { status: 400 }
    );
  }

  // Revoke invitation
  const { error: revokeError } = await supabase
    .from("profile_access_invitations")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);

  if (revokeError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: revokeError.message } },
      { status: 500 }
    );
  }

  // Log audit activity
  await supabase.from("care_activities").insert({
    healthcare_profile_id: invitation.healthcare_profile_id,
    actor_id: user.id,
    actor_role: member.role,
    action_type: "INVITATION_REVOKED",
    action_payload: { invitationId: id, invitedRole: invitation.invited_role },
  });

  return NextResponse.json({ success: true, data: { message: "Invitation successfully revoked." } }, { status: 200 });
}
