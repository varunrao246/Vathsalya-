import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications/preferences?healthcareProfileId=...
 * Retrieves notification settings for the authenticated user and healthcare profile.
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

  // Fetch or default preferences
  const { data: pref } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("healthcare_profile_id", healthcareProfileId)
    .eq("profile_id", user.id)
    .maybeSingle();

  const defaultPreferences = {
    healthcareProfileId,
    profileId: user.id,
    telegramEnabled: pref ? pref.telegram_enabled : true,
    emailEnabled: false,
    reminderMinutesBefore: pref ? pref.reminder_minutes_before : 15,
    overdueCaretakerGraceMinutes: pref ? pref.overdue_caretaker_grace_minutes : 30,
    familyEscalationGraceMinutes: pref ? pref.family_escalation_grace_minutes : 60,
  };

  return NextResponse.json({ success: true, data: defaultPreferences }, { status: 200 });
}

/**
 * PUT /api/notifications/preferences
 * Updates notification settings. Rejects FAMILY_VIEWER from modifying settings.
 */
export async function PUT(req: Request) {
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
      telegramEnabled = true,
      reminderMinutesBefore = 15,
      overdueCaretakerGraceMinutes = 30,
      familyEscalationGraceMinutes = 60,
    } = body;

    if (!healthcareProfileId) {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "healthcareProfileId is required." } },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify membership & role permissions
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

    // Role Guard: FAMILY_VIEWER is read-only
    if (member.role === "FAMILY_VIEWER") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Family Viewers with read-only access cannot modify notification preferences.",
          },
        },
        { status: 403 }
      );
    }

    // Upsert preferences
    const { data: updated, error: upsertError } = await supabase
      .from("notification_preferences")
      .upsert(
        {
          healthcare_profile_id: healthcareProfileId,
          profile_id: user.id,
          telegram_enabled: Boolean(telegramEnabled),
          email_enabled: false,
          reminder_minutes_before: Math.max(5, Math.min(60, Number(reminderMinutesBefore) || 15)),
          overdue_caretaker_grace_minutes: Math.max(15, Math.min(120, Number(overdueCaretakerGraceMinutes) || 30)),
          family_escalation_grace_minutes: Math.max(30, Math.min(240, Number(familyEscalationGraceMinutes) || 60)),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "healthcare_profile_id,profile_id" }
      )
      .select()
      .single();

    if (upsertError || !updated) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: upsertError?.message || "Failed to update preferences." } },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          healthcareProfileId: updated.healthcare_profile_id,
          profileId: updated.profile_id,
          telegramEnabled: updated.telegram_enabled,
          emailEnabled: updated.email_enabled,
          reminderMinutesBefore: updated.reminder_minutes_before,
          overdueCaretakerGraceMinutes: updated.overdue_caretaker_grace_minutes,
          familyEscalationGraceMinutes: updated.family_escalation_grace_minutes,
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
