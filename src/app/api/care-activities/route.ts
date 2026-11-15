import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/care-activities?healthcareProfileId=<UUID>&limit=20
 * Returns the immutable audit timeline of all care actions, doses, appointments, and caretaker interventions.
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
  const limit = Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10), 1), 100);

  if (!healthcareProfileId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "healthcareProfileId is required." } },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Verify access membership
  const { data: member, error: memberErr } = await supabase
    .from("profile_access_members")
    .select("role")
    .eq("healthcare_profile_id", healthcareProfileId)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberErr || !member) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Access denied to this healthcare profile." } },
      { status: 403 }
    );
  }

  const { data: activities, error: actErr } = await supabase
    .from("care_activities")
    .select(`
      id,
      healthcare_profile_id,
      actor_id,
      actor_role,
      action_type,
      action_payload,
      created_at
    `)
    .eq("healthcare_profile_id", healthcareProfileId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (actErr) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: actErr.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: activities || [],
  });
}
