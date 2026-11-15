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

  // Verify caller membership in healthcare profile
  const { data: member, error: memberError } = await supabase
    .from("profile_access_members")
    .select("role, can_manage_meds")
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

  // Fetch medications with active schedules
  const { data: medications, error: medsError } = await supabase
    .from("medications")
    .select(`
      id,
      healthcare_profile_id,
      name,
      generic_name,
      dosage_strength,
      dosage_form,
      instructions,
      prescribing_doctor,
      start_date,
      end_date,
      is_active,
      created_at,
      updated_at,
      schedules:medication_schedules (
        id,
        target_time,
        meal_timing,
        dose_quantity,
        frequency_type,
        days_of_week,
        reminder_minutes_before,
        is_active
      )
    `)
    .eq("healthcare_profile_id", healthcareProfileId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (medsError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: medsError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: medications || [] }, { status: 200 });
}

interface ScheduleSlotInput {
  targetTime?: string;
  mealTiming?: string;
  doseQuantity?: number;
  frequencyType?: string;
  daysOfWeek?: number[];
  reminderMinutesBefore?: number;
}

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
      name,
      genericName,
      dosageStrength,
      dosageForm = "TABLET",
      instructions,
      prescribingDoctor,
      startDate = new Date().toISOString().split("T")[0],
      endDate = null,
      schedules = [],
    } = body;

    // Validation
    if (!healthcareProfileId || !name?.trim() || !dosageStrength?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "healthcareProfileId, name, and dosageStrength are required.",
          },
        },
        { status: 400 }
      );
    }

    if (!Array.isArray(schedules) || schedules.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "SCHEDULE_REQUIRED",
            message: "At least one daily schedule slot is required for a medication.",
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Verify caller has permission to manage medications
    const { data: member, error: memberError } = await supabase
      .from("profile_access_members")
      .select("role, can_manage_meds")
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

    // Role check: Only ELDERLY, FAMILY_ADMIN, or member with can_manage_meds = true
    const canManage =
      member.role === "ELDERLY" ||
      member.role === "FAMILY_ADMIN" ||
      member.can_manage_meds === true;

    if (!canManage) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "PERMISSION_DENIED",
            message: "You do not have permission to add or modify medications.",
          },
        },
        { status: 403 }
      );
    }

    // 1. Insert medication master record
    const { data: newMed, error: medError } = await supabase
      .from("medications")
      .insert({
        healthcare_profile_id: healthcareProfileId,
        name: name.trim(),
        generic_name: genericName ? genericName.trim() : null,
        dosage_strength: dosageStrength.trim(),
        dosage_form: dosageForm,
        instructions: instructions ? instructions.trim() : null,
        prescribing_doctor: prescribingDoctor ? prescribingDoctor.trim() : null,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
      })
      .select()
      .single();

    if (medError || !newMed) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: medError?.message || "Failed to create medication." } },
        { status: 500 }
      );
    }

    // 2. Insert schedule slots
    const scheduleRows = schedules.map((slot: ScheduleSlotInput) => ({
      medication_id: newMed.id,
      target_time: slot.targetTime || "08:30:00",
      meal_timing: slot.mealTiming || "AFTER_MEAL",
      dose_quantity: slot.doseQuantity || 1.0,
      frequency_type: slot.frequencyType || "DAILY",
      days_of_week: slot.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
      reminder_minutes_before: slot.reminderMinutesBefore || 15,
      is_active: true,
    }));

    const { data: createdSchedules, error: schedError } = await supabase
      .from("medication_schedules")
      .insert(scheduleRows)
      .select();

    if (schedError) {
      return NextResponse.json(
        { success: false, error: { code: "SCHEDULE_INSERT_ERROR", message: schedError.message } },
        { status: 500 }
      );
    }

    // 3. Log audit activity in care_activities
    await supabase.from("care_activities").insert({
      healthcare_profile_id: healthcareProfileId,
      actor_id: user.id,
      actor_role: member.role,
      action_type: "MEDICATION_ADDED",
      action_payload: {
        medicationId: newMed.id,
        name: newMed.name,
        dosageStrength: newMed.dosage_strength,
        slotCount: createdSchedules?.length || 0,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newMed,
          schedules: createdSchedules || [],
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload" } },
      { status: 400 }
    );
  }
}
