import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { EscalationResolutionAction } from "@/lib/notifications/types";

export const dynamic = "force-dynamic";

const VALID_ACTIONS: EscalationResolutionAction[] = [
  "CALL_COMPLETED",
  "DOSE_CONFIRMED_BY_ELDER",
  "ADMINISTERED_BY_CARETAKER",
  "ELDER_REPORTS_ALREADY_TAKEN",
  "ASSISTANCE_REQUIRED",
  "UNABLE_TO_REACH",
  "FOLLOW_UP_PENDING",
];

/**
 * POST /api/escalations/action
 * Authenticated action interface for caretakers and family admins to resolve or log follow-up.
 */
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
      escalationId,
      healthcareProfileId,
      action,
      notes,
      scheduleOccurrenceKey,
      scheduleId,
      scheduledAt,
      scheduledDate,
      scheduledTime,
    } = body;

    if (!healthcareProfileId || !action) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "healthcareProfileId and action are required.",
          },
        },
        { status: 400 }
      );
    }

    if (!VALID_ACTIONS.includes(action as EscalationResolutionAction)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_ACTION",
            message: `Invalid action. Must be one of: ${VALID_ACTIONS.join(", ")}`,
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // 1. Verify membership and RBAC
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

    // Role check: Only ELDERLY, FAMILY_ADMIN, or CARETAKER can take escalation action
    if (member.role === "FAMILY_VIEWER") {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "Family Viewers with read-only access cannot resolve care escalations.",
          },
        },
        { status: 403 }
      );
    }

    // If caretaker is confirming they directly administered the dose, check can_confirm_doses
    if (action === "ADMINISTERED_BY_CARETAKER") {
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
              message: "You do not have explicit permission to record direct medication administration.",
            },
          },
          { status: 403 }
        );
      }
    }

    // 2. Determine resulting escalation status
    // Resolving actions: DOSE_CONFIRMED_BY_ELDER, ADMINISTERED_BY_CARETAKER, ELDER_REPORTS_ALREADY_TAKEN
    // In-progress actions: CALL_COMPLETED, ASSISTANCE_REQUIRED, UNABLE_TO_REACH, FOLLOW_UP_PENDING
    const isResolved = [
      "DOSE_CONFIRMED_BY_ELDER",
      "ADMINISTERED_BY_CARETAKER",
      "ELDER_REPORTS_ALREADY_TAKEN",
    ].includes(action);

    const escalationStatus = isResolved ? "RESOLVED" : "IN_PROGRESS";

    // 3. Update escalation_events if escalationId or scheduleOccurrenceKey is provided
    let updatedEscalation = null;
    if (escalationId) {
      const { data: escData } = await supabase
        .from("escalation_events")
        .update({
          status: escalationStatus,
          resolution_action: action,
          resolution_notes: notes ? String(notes).trim() : null,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", escalationId)
        .select()
        .single();

      updatedEscalation = escData;
    } else if (scheduleOccurrenceKey) {
      const { data: escData } = await supabase
        .from("escalation_events")
        .update({
          status: escalationStatus,
          resolution_action: action,
          resolution_notes: notes ? String(notes).trim() : null,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("schedule_occurrence_key", scheduleOccurrenceKey)
        .select();

      updatedEscalation = escData?.[0] || null;
    }

    // 4. Clinical Intake Confirmation Guard:
    // Strictly ONLY ADMINISTERED_BY_CARETAKER and DOSE_CONFIRMED_BY_ELDER record a TAKEN state.
    // ELDER_REPORTS_ALREADY_TAKEN is recorded as an unverified verbal report, NOT automatic proof of ingestion!
    // CALL_COMPLETED, UNABLE_TO_REACH, ASSISTANCE_REQUIRED, and FOLLOW_UP_PENDING NEVER mark as TAKEN.
    const isDirectIntakeConfirmed =
      action === "ADMINISTERED_BY_CARETAKER" || action === "DOSE_CONFIRMED_BY_ELDER";

    let recordedDoseLog = null;
    if (isDirectIntakeConfirmed && scheduleId && scheduleOccurrenceKey && scheduledAt && scheduledDate && scheduledTime) {
      const actorRole =
        action === "ADMINISTERED_BY_CARETAKER" ? "CARETAKER" : "ELDERLY";

      const { data: logData } = await supabase
        .from("dose_logs")
        .upsert(
          {
            schedule_id: scheduleId,
            healthcare_profile_id: healthcareProfileId,
            scheduled_at: new Date(scheduledAt).toISOString(),
            scheduled_date: scheduledDate,
            scheduled_time: scheduledTime,
            scheduled_occurrence_key: scheduleOccurrenceKey,
            status: "TAKEN",
            actor_id: user.id,
            actor_role: actorRole,
            recorded_at: new Date().toISOString(),
            notes: notes ? String(notes).trim() : `Confirmed via caretaker escalation follow-up (${action})`,
          },
          { onConflict: "scheduled_occurrence_key" }
        )
        .select()
        .single();

      recordedDoseLog = logData;
    }

    // 5. Immutable Audit Trail in care_activities
    await supabase.from("care_activities").insert({
      healthcare_profile_id: healthcareProfileId,
      actor_id: user.id,
      actor_role: member.role,
      action_type: "CARE_ESCALATION_FOLLOW_UP",
      action_payload: {
        escalationId,
        action,
        status: escalationStatus,
        notes: notes ? String(notes).trim() : null,
        doseConfirmed: Boolean(recordedDoseLog),
        isVerbalReportOnly: action === "ELDER_REPORTS_ALREADY_TAKEN",
        doseLogId: recordedDoseLog?.id || null,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          action,
          status: escalationStatus,
          isResolved,
          escalation: updatedEscalation,
          doseLog: recordedDoseLog,
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
