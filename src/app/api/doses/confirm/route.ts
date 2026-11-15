import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { generateDoseOccurrenceKey } from "@/lib/medications/dose-engine";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
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
      scheduleId,
      scheduledAt,
      scheduledDate,
      scheduledTime,
      action = "TAKEN",
      notes,
    } = body;

    // Validation
    if (!healthcareProfileId || !scheduleId || !scheduledAt || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "healthcareProfileId, scheduleId, scheduledAt, scheduledDate, and scheduledTime are required.",
          },
        },
        { status: 400 }
      );
    }

    if (!["TAKEN", "SKIPPED"].includes(action)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ACTION",
            message: "Action must be TAKEN or SKIPPED.",
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // 1. Verify caller membership and role-based permissions
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

    // Role permission check
    const canConfirm =
      member.role === "ELDERLY" ||
      member.role === "FAMILY_ADMIN" ||
      member.can_confirm_doses === true;

    if (!canConfirm) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "You do not have permission to confirm or record dose administration.",
          },
        },
        { status: 403 }
      );
    }

    // 2. Compute timezone-aware occurrence key
    const occurrenceDate = new Date(scheduledAt);
    const occurrenceKey = generateDoseOccurrenceKey(scheduleId, occurrenceDate);

    // 3. Idempotency Check: check if already confirmed
    const { data: existingLog } = await supabase
      .from("dose_logs")
      .select("id, status, recorded_at, actor_role, notes")
      .eq("scheduled_occurrence_key", occurrenceKey)
      .maybeSingle();

    if (existingLog && existingLog.status === "TAKEN" && action === "TAKEN") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DOSE_ALREADY_CONFIRMED",
            message: `This dose was already confirmed as taken at ${new Date(
              existingLog.recorded_at
            ).toLocaleTimeString()} (${existingLog.actor_role}).`,
            details: {
              doseLogId: existingLog.id,
              recordedAt: existingLog.recorded_at,
              actorRole: existingLog.actor_role,
            },
          },
        },
        { status: 409 }
      );
    }

    // 4. Record dose execution (upsert with unique occurrence key)
    const { data: recordedLog, error: upsertError } = await supabase
      .from("dose_logs")
      .upsert(
        {
          schedule_id: scheduleId,
          healthcare_profile_id: healthcareProfileId,
          scheduled_at: occurrenceDate.toISOString(),
          scheduled_date: scheduledDate,
          scheduled_time: scheduledTime,
          scheduled_occurrence_key: occurrenceKey,
          status: action,
          actor_id: user.id,
          actor_role: member.role,
          recorded_at: new Date().toISOString(),
          notes: notes ? String(notes).trim() : null,
        },
        { onConflict: "scheduled_occurrence_key" }
      )
      .select()
      .single();

    if (upsertError || !recordedLog) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "DB_ERROR", message: upsertError?.message || "Failed to record dose status." },
        },
        { status: 500 }
      );
    }

    // 5. Log audit trail in care_activities
    await supabase.from("care_activities").insert({
      healthcare_profile_id: healthcareProfileId,
      actor_id: user.id,
      actor_role: member.role,
      action_type: action === "TAKEN" ? "DOSE_CONFIRMED" : "DOSE_SKIPPED",
      action_payload: {
        doseLogId: recordedLog.id,
        scheduleId,
        scheduledAt,
        status: action,
        notes: recordedLog.notes,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          doseLogId: recordedLog.id,
          status: recordedLog.status,
          recordedAt: recordedLog.recorded_at,
          actorRole: recordedLog.actor_role,
          notes: recordedLog.notes,
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
