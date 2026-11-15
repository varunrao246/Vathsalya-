import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getOrGenerateProfileCareInsight } from "@/lib/ai/gemini";

export const dynamic = "force-dynamic";

/**
 * GET /api/care-insights?healthcareProfileId=<UUID>&forceRefresh=<boolean>
 * Returns an AI-powered or cached clinical care summary for family members and caretakers.
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
  const forceRefresh = searchParams.get("forceRefresh") === "true";

  if (!healthcareProfileId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "healthcareProfileId is required." } },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Verify access membership
  const { data: member, error: memberError } = await supabase
    .from("profile_access_members")
    .select("role")
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

  // Get profile display name
  const { data: profile } = await supabase
    .from("healthcare_profiles")
    .select("display_name")
    .eq("id", healthcareProfileId)
    .single();

  const profileName = profile?.display_name || "Elderly Member";

  try {
    const insight = await getOrGenerateProfileCareInsight(
      healthcareProfileId,
      profileName,
      forceRefresh
    );

    return NextResponse.json({
      success: true,
      data: insight,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "INSIGHT_GENERATION_FAILED",
          message: err instanceof Error ? err.message : "Failed to generate care summary",
        },
      },
      { status: 500 }
    );
  }
}
