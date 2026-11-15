import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/escalations/pending?healthcareProfileId=...
 * Lists pending escalation follow-up tasks for active care team members.
 */
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

  // Verify membership
  const { data: member, error: memberError } = await supabase
    .from("profile_access_members")
    .select("role, can_confirm_doses")
    .eq("healthcare_profile_id", healthcareProfileId)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You do not have access to this healthcare profile." } },
      { status: 403 }
    );
  }

  // Fetch pending or in-progress escalation events
  const { data: escalations, error: escError } = await supabase
    .from("escalation_events")
    .select("*")
    .eq("healthcare_profile_id", healthcareProfileId)
    .in("status", ["PENDING", "IN_PROGRESS"])
    .order("created_at", { ascending: false });

  if (escError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: escError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      data: escalations || [],
      callerRole: member.role,
      canConfirmDoses: member.can_confirm_doses,
    },
    { status: 200 }
  );
}
