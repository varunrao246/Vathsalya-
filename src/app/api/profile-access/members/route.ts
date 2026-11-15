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

  // Verify caller has active membership in this healthcare profile
  const { data: callerMember, error: callerError } = await supabase
    .from("profile_access_members")
    .select("role")
    .eq("healthcare_profile_id", healthcareProfileId)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (callerError || !callerMember) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You do not have access to this healthcare profile." } },
      { status: 403 }
    );
  }

  // Fetch all members with profile details
  const { data: members, error: membersError } = await supabase
    .from("profile_access_members")
    .select(`
      id,
      profile_id,
      role,
      can_manage_meds,
      can_manage_appointments,
      can_confirm_doses,
      status,
      joined_at,
      profile:profiles (
        full_name,
        email,
        phone,
        preferred_language,
        avatar_url
      )
    `)
    .eq("healthcare_profile_id", healthcareProfileId)
    .order("joined_at", { ascending: true });

  if (membersError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: membersError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: {
        callerRole: callerMember.role,
        members: members || [],
      },
    },
    { status: 200 }
  );
}
