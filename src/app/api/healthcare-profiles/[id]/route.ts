import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(
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

  // Verify access membership
  const { data: member, error: memberError } = await supabase
    .from("profile_access_members")
    .select("role, can_manage_meds, can_manage_appointments, can_confirm_doses")
    .eq("healthcare_profile_id", id)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You do not have access to this healthcare profile." } },
      { status: 403 }
    );
  }

  // Fetch healthcare profile
  const { data: profile, error: profileError } = await supabase
    .from("healthcare_profiles")
    .select("*")
    .eq("id", id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Healthcare profile not found." } },
      { status: 404 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        ...profile,
        userRole: member.role,
        permissions: {
          canManageMeds: member.can_manage_meds,
          canManageAppointments: member.can_manage_appointments,
          canConfirmDoses: member.can_confirm_doses,
        },
      },
    },
    { status: 200 }
  );
}
