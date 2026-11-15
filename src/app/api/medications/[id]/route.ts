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

  // Fetch medication
  const { data: med, error: medError } = await supabase
    .from("medications")
    .select(`
      *,
      schedules:medication_schedules (*)
    `)
    .eq("id", id)
    .single();

  if (medError || !med) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Medication not found." } },
      { status: 404 }
    );
  }

  // Verify membership in healthcare profile
  const { data: member, error: memberError } = await supabase
    .from("profile_access_members")
    .select("role, can_manage_meds")
    .eq("healthcare_profile_id", med.healthcare_profile_id)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You do not have access to this healthcare profile." } },
      { status: 403 }
    );
  }

  return NextResponse.json({ success: true, data: med }, { status: 200 });
}

export async function PATCH(
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

  // Fetch existing medication
  const { data: med, error: medError } = await supabase
    .from("medications")
    .select("id, healthcare_profile_id, name, is_active")
    .eq("id", id)
    .single();

  if (medError || !med) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Medication not found." } },
      { status: 404 }
    );
  }

  // Verify management permission
  const { data: member, error: memberError } = await supabase
    .from("profile_access_members")
    .select("role, can_manage_meds")
    .eq("healthcare_profile_id", med.healthcare_profile_id)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You do not have access to this healthcare profile." } },
      { status: 403 }
    );
  }

  const canManage =
    member.role === "ELDERLY" ||
    member.role === "FAMILY_ADMIN" ||
    member.can_manage_meds === true;

  if (!canManage) {
    return NextResponse.json(
      { success: false, error: { code: "PERMISSION_DENIED", message: "You do not have permission to edit medications." } },
      { status: 403 }
    );
  }

  try {
    const body = await req.json();
    const updatePayload: Record<string, string | boolean | null> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updatePayload.name = body.name.trim();
    if (body.dosageStrength !== undefined) updatePayload.dosage_strength = body.dosageStrength.trim();
    if (body.dosageForm !== undefined) {
      const VALID_DOSAGE_FORMS = ["TABLET", "CAPSULE", "SYRUP", "INJECTION", "DROPS", "INHALER", "OTHER"];
      const normalizedForm = String(body.dosageForm).toUpperCase();
      if (!VALID_DOSAGE_FORMS.includes(normalizedForm)) {
        return NextResponse.json(
          { success: false, error: { code: "VALIDATION_ERROR", message: `Invalid dosageForm: ${body.dosageForm}` } },
          { status: 400 }
        );
      }
      updatePayload.dosage_form = normalizedForm;
    }
    if (body.instructions !== undefined) updatePayload.instructions = body.instructions?.trim() || null;
    if (body.prescribingDoctor !== undefined) updatePayload.prescribing_doctor = body.prescribingDoctor?.trim() || null;
    if (body.isActive !== undefined) updatePayload.is_active = Boolean(body.isActive);
    if (body.endDate !== undefined) updatePayload.end_date = body.endDate;

    const { data: updatedMed, error: updateError } = await supabase
      .from("medications")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (updateError || !updatedMed) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: updateError?.message || "Failed to update medication." } },
        { status: 500 }
      );
    }

    // Log audit activity
    await supabase.from("care_activities").insert({
      healthcare_profile_id: med.healthcare_profile_id,
      actor_id: user.id,
      actor_role: member.role,
      action_type: body.isActive !== undefined && body.isActive !== med.is_active
        ? body.isActive ? "MEDICATION_RESUMED" : "MEDICATION_PAUSED"
        : "MEDICATION_UPDATED",
      action_payload: { medicationId: id, name: updatedMed.name, changes: updatePayload },
    });

    return NextResponse.json({ success: true, data: updatedMed }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload" } },
      { status: 400 }
    );
  }
}

export async function DELETE(
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

  // Fetch existing medication
  const { data: med, error: medError } = await supabase
    .from("medications")
    .select("id, healthcare_profile_id, name")
    .eq("id", id)
    .single();

  if (medError || !med) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Medication not found." } },
      { status: 404 }
    );
  }

  // Verify permission
  const { data: member, error: memberError } = await supabase
    .from("profile_access_members")
    .select("role, can_manage_meds")
    .eq("healthcare_profile_id", med.healthcare_profile_id)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberError || !member) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You do not have access to this healthcare profile." } },
      { status: 403 }
    );
  }

  const canManage =
    member.role === "ELDERLY" ||
    member.role === "FAMILY_ADMIN" ||
    member.can_manage_meds === true;

  if (!canManage) {
    return NextResponse.json(
      { success: false, error: { code: "PERMISSION_DENIED", message: "You do not have permission to discontinue medications." } },
      { status: 403 }
    );
  }

  // Soft delete: sets deleted_at = now() and is_active = false
  // Critical Requirement: Preserves historical dose_logs completely
  const { error: deleteError } = await supabase
    .from("medications")
    .update({
      deleted_at: new Date().toISOString(),
      is_active: false,
    })
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: deleteError.message } },
      { status: 500 }
    );
  }

  // Also deactivate associated schedules
  await supabase
    .from("medication_schedules")
    .update({ is_active: false })
    .eq("medication_id", id);

  // Log audit activity
  await supabase.from("care_activities").insert({
    healthcare_profile_id: med.healthcare_profile_id,
    actor_id: user.id,
    actor_role: member.role,
    action_type: "MEDICATION_DISCONTINUED",
    action_payload: { medicationId: id, name: med.name },
  });

  return NextResponse.json(
    { success: true, data: { message: "Medication discontinued successfully. Historical dose logs preserved." } },
    { status: 200 }
  );
}
