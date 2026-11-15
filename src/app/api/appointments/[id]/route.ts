import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/appointments/[id]
 * Reschedule, update companion, or mark completed.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id: appointmentId } = await params;
  const supabase = await createServerSupabaseClient();

  // Find existing appointment
  const { data: existing, error: findErr } = await supabase
    .from("appointments")
    .select("id, healthcare_profile_id, doctor_name, specialty, clinic_name, status, appointment_time")
    .eq("id", appointmentId)
    .is("deleted_at", null)
    .single();

  if (findErr || !existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Appointment not found." } },
      { status: 404 }
    );
  }

  // Check user permission
  const { data: member, error: memberErr } = await supabase
    .from("profile_access_members")
    .select("role, can_manage_appointments")
    .eq("healthcare_profile_id", existing.healthcare_profile_id)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberErr || !member || (!member.can_manage_appointments && !["OWNER", "FAMILY_ADMIN"].includes(member.role))) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Permission denied to modify appointment." } },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const updates: Record<string, unknown> = {};

  if (body.status && ["SCHEDULED", "COMPLETED", "CANCELLED", "RESCHEDULED"].includes(body.status)) {
    updates.status = body.status;
  }
  if (body.appointmentTime) {
    const t = new Date(body.appointmentTime);
    if (!isNaN(t.getTime())) updates.appointment_time = t.toISOString();
  }
  if (body.notes !== undefined) updates.notes = body.notes;
  if (body.companionMemberId !== undefined) updates.companion_member_id = body.companionMemberId || null;
  if (body.doctorName) updates.doctor_name = body.doctorName.trim();
  if (body.specialty) updates.specialty = body.specialty.trim();
  if (body.clinicName) updates.clinic_name = body.clinicName.trim();
  if (body.locationOrLink) updates.location_or_link = body.locationOrLink.trim();

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "No valid fields provided for update." } },
      { status: 400 }
    );
  }

  const { data: updated, error: updateErr } = await supabase
    .from("appointments")
    .update(updates)
    .eq("id", appointmentId)
    .select()
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: updateErr?.message || "Failed to update appointment" } },
      { status: 500 }
    );
  }

  // Audit activity log
  await supabase.from("care_activities").insert({
    healthcare_profile_id: existing.healthcare_profile_id,
    actor_id: user.id,
    actor_role: member.role,
    action_type: updates.status === "COMPLETED" ? "APPOINTMENT_COMPLETED" : "APPOINTMENT_UPDATED",
    action_payload: {
      appointmentId,
      updates,
      doctorName: updated.doctor_name,
    },
  });

  return NextResponse.json({
    success: true,
    data: updated,
    message: "Appointment successfully updated.",
  });
}

/**
 * DELETE /api/appointments/[id]
 * Soft-delete / cancel appointment.
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const { id: appointmentId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: existing, error: findErr } = await supabase
    .from("appointments")
    .select("id, healthcare_profile_id, doctor_name")
    .eq("id", appointmentId)
    .is("deleted_at", null)
    .single();

  if (findErr || !existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOT_FOUND", message: "Appointment not found." } },
      { status: 404 }
    );
  }

  const { data: member, error: memberErr } = await supabase
    .from("profile_access_members")
    .select("role, can_manage_appointments")
    .eq("healthcare_profile_id", existing.healthcare_profile_id)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberErr || !member || (!member.can_manage_appointments && !["OWNER", "FAMILY_ADMIN"].includes(member.role))) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "Permission denied to cancel appointment." } },
      { status: 403 }
    );
  }

  const now = new Date().toISOString();
  const { error: deleteErr } = await supabase
    .from("appointments")
    .update({ status: "CANCELLED", deleted_at: now })
    .eq("id", appointmentId);

  if (deleteErr) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: deleteErr.message } },
      { status: 500 }
    );
  }

  await supabase.from("care_activities").insert({
    healthcare_profile_id: existing.healthcare_profile_id,
    actor_id: user.id,
    actor_role: member.role,
    action_type: "APPOINTMENT_CANCELLED",
    action_payload: {
      appointmentId,
      doctorName: existing.doctor_name,
    },
  });

  return NextResponse.json({
    success: true,
    message: "Appointment successfully cancelled.",
  });
}
