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

  // Find the target member record to identify healthcare_profile_id
  const { data: targetMember, error: findError } = await supabase
    .from("profile_access_members")
    .select("id, healthcare_profile_id, profile_id, role")
    .eq("id", id)
    .single();

  if (findError || !targetMember) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Member access record not found." } },
      { status: 404 }
    );
  }

  // Check if caller is Owner or Admin of this healthcare profile
  const { data: callerMember, error: callerError } = await supabase
    .from("profile_access_members")
    .select("role")
    .eq("healthcare_profile_id", targetMember.healthcare_profile_id)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .in("role", ["ELDERLY", "FAMILY_ADMIN"])
    .single();

  if (callerError || !callerMember) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Only profile owners or family admins can revoke access." } },
      { status: 403 }
    );
  }

  // Cannot delete the primary elderly owner
  if (targetMember.role === "ELDERLY") {
    return NextResponse.json(
      { success: false, error: { code: "CANNOT_REVOKE_OWNER", message: "Cannot revoke access of the elderly profile owner." } },
      { status: 400 }
    );
  }

  // Revoke member access
  const { error: deleteError } = await supabase
    .from("profile_access_members")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: deleteError.message } },
      { status: 500 }
    );
  }

  // Log audit activity
  await supabase.from("care_activities").insert({
    healthcare_profile_id: targetMember.healthcare_profile_id,
    actor_id: user.id,
    actor_role: callerMember.role,
    action_type: "MEMBER_ACCESS_REVOKED",
    action_payload: {
      revokedMemberId: targetMember.id,
      revokedProfileId: targetMember.profile_id,
      revokedRole: targetMember.role,
    },
  });

  return NextResponse.json(
    { success: true, data: { message: "Access successfully revoked." } },
    { status: 200 }
  );
}
