import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  doesScheduleApplyOnDate,
  evaluateDoseOccurrenceStatus,
  buildScheduledDate,
  generateDoseOccurrenceKey,
  DoseOccurrence,
} from "@/lib/medications/dose-engine";

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
  const targetDateStr = searchParams.get("date") || new Date().toISOString().split("T")[0];

  if (!healthcareProfileId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "healthcareProfileId is required." } },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Verify caller membership in healthcare profile
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

  // Fetch healthcare profile time zone
  const { data: hp } = await supabase
    .from("healthcare_profiles")
    .select("time_zone")
    .eq("id", healthcareProfileId)
    .maybeSingle();

  const timeZone = hp?.time_zone || "Asia/Kolkata";

  // 1. Fetch medications for profile (including historical medications active on target date)
  const { data: medications, error: medsError } = await supabase
    .from("medications")
    .select(`
      id,
      name,
      dosage_strength,
      dosage_form,
      instructions,
      start_date,
      end_date,
      is_active,
      deleted_at,
      schedules:medication_schedules (
        id,
        medication_id,
        target_time,
        meal_timing,
        dose_quantity,
        frequency_type,
        days_of_week,
        reminder_minutes_before,
        is_active
      )
    `)
    .eq("healthcare_profile_id", healthcareProfileId);

  if (medsError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: medsError.message } },
      { status: 500 }
    );
  }

  // 2. Fetch existing dose_logs for this date
  const { data: doseLogs, error: logsError } = await supabase
    .from("dose_logs")
    .select("*")
    .eq("healthcare_profile_id", healthcareProfileId)
    .eq("scheduled_date", targetDateStr);

  if (logsError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: logsError.message } },
      { status: 500 }
    );
  }

  const currentTime = new Date();
  const timeline: DoseOccurrence[] = [];

  // 3. Evaluate each medication schedule
  for (const med of medications || []) {
    // Discontinuation audit: If discontinued prior to target date, only include if dose logs exist for that date
    if (med.deleted_at) {
      const deletedDateStr = new Date(med.deleted_at).toISOString().split("T")[0];
      if (deletedDateStr < targetDateStr) {
        const hasLogsForMed = (doseLogs || []).some((l) =>
          med.schedules?.some((s: { id: string }) => s.id === l.schedule_id)
        );
        if (!hasLogsForMed) continue;
      }
    }

    for (const sched of med.schedules || []) {
      // If schedule was deactivated, only evaluate if an existing dose log was recorded on this date
      const hasLogForSched = (doseLogs || []).some((log) => log.schedule_id === sched.id);
      if (!sched.is_active && !hasLogForSched) {
        continue;
      }

      const applies = doesScheduleApplyOnDate(
        {
          id: sched.id,
          medication_id: sched.medication_id,
          target_time: sched.target_time,
          meal_timing: sched.meal_timing,
          dose_quantity: sched.dose_quantity,
          frequency_type: sched.frequency_type,
          days_of_week: sched.days_of_week,
          reminder_minutes_before: sched.reminder_minutes_before,
          is_active: true, // evaluated conditionally above
          start_date: med.start_date,
          end_date: med.end_date,
        },
        targetDateStr
      );

      if (!applies && !hasLogForSched) continue;

      const scheduledAt = buildScheduledDate(targetDateStr, sched.target_time, timeZone);
      const occurrenceKey = generateDoseOccurrenceKey(sched.id, scheduledAt);

      // Check if existing dose log exists for this occurrence
      const existingLog = (doseLogs || []).find(
        (log) =>
          log.schedule_id === sched.id &&
          (log.scheduled_occurrence_key === occurrenceKey ||
            new Date(log.scheduled_at).getTime() === scheduledAt.getTime())
      );

      const status = evaluateDoseOccurrenceStatus({
        scheduledAt,
        currentTime,
        existingLog: existingLog ? { status: existingLog.status } : null,
      });

      timeline.push({
        scheduleId: sched.id,
        medicationId: med.id,
        medicationName: med.name,
        dosageStrength: med.dosage_strength,
        dosageForm: med.dosage_form,
        instructions: med.instructions,
        targetTime: sched.target_time,
        scheduledAt: scheduledAt.toISOString(),
        scheduledDate: targetDateStr,
        scheduledTime: sched.target_time,
        occurrenceKey,
        mealTiming: sched.meal_timing,
        doseQuantity: sched.dose_quantity,
        status,
        doseLogId: existingLog?.id,
        recordedAt: existingLog?.recorded_at,
        actorId: existingLog?.actor_id,
        actorRole: existingLog?.actor_role,
        notes: existingLog?.notes,
      });
    }
  }

  // Sort timeline chronologically by target time
  timeline.sort((a, b) => a.targetTime.localeCompare(b.targetTime));

  const totalDoses = timeline.length;
  const takenDoses = timeline.filter((d) => d.status === "TAKEN").length;
  const dueDoses = timeline.filter((d) => d.status === "DUE").length;
  const overdueDoses = timeline.filter((d) => d.status === "OVERDUE").length;

  return NextResponse.json(
    {
      success: true,
      data: {
        date: targetDateStr,
        summary: {
          total: totalDoses,
          taken: takenDoses,
          due: dueDoses,
          overdue: overdueDoses,
          adherencePercentage: totalDoses > 0 ? Math.round((takenDoses / totalDoses) * 100) : 100,
        },
        timeline,
        callerRole: member.role,
        canConfirmDoses: member.can_confirm_doses,
      },
    },
    { status: 200 }
  );
}
