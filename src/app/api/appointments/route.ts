import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/appointments?healthcareProfileId=<UUID>&type=upcoming|historical|all
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
  const type = searchParams.get("type") || "upcoming";

  if (!healthcareProfileId) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "healthcareProfileId is required." } },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Verify access
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

  const now = new Date().toISOString();
  let query = supabase
    .from("appointments")
    .select(`
      id,
      healthcare_profile_id,
      doctor_name,
      specialty,
      clinic_name,
      location_or_link,
      appointment_time,
      status,
      companion_member_id,
      notes,
      created_at
    `)
    .eq("healthcare_profile_id", healthcareProfileId)
    .is("deleted_at", null);

  if (type === "upcoming") {
    query = query
      .gte("appointment_time", now)
      .eq("status", "SCHEDULED")
      .order("appointment_time", { ascending: true });
  } else if (type === "historical") {
    query = query
      .or(`appointment_time.lt.${now},status.in.(COMPLETED,CANCELLED)`)
      .order("appointment_time", { ascending: false });
  } else {
    query = query.order("appointment_time", { ascending: true });
  }

  const { data: appointments, error: apptErr } = await query;

  if (apptErr) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: apptErr.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: appointments || [],
  });
}

/**
 * POST /api/appointments
 * Create a new clinical appointment.
 */
export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  let body: {
    healthcareProfileId: string;
    doctorName: string;
    specialty: string;
    clinicName: string;
    locationOrLink: string;
    appointmentTime: string;
    companionMemberId?: string;
    notes?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } },
      { status: 400 }
    );
  }

  const {
    healthcareProfileId,
    doctorName,
    specialty,
    clinicName,
    locationOrLink,
    appointmentTime,
    companionMemberId,
    notes,
  } = body;

  if (!healthcareProfileId || !doctorName || !specialty || !clinicName || !locationOrLink || !appointmentTime) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "healthcareProfileId, doctorName, specialty, clinicName, locationOrLink, and appointmentTime are required.",
        },
      },
      { status: 400 }
    );
  }

  const parsedTime = new Date(appointmentTime);
  if (isNaN(parsedTime.getTime())) {
    return NextResponse.json(
      { success: false, error: { code: "VALIDATION_ERROR", message: "appointmentTime must be a valid ISO date." } },
      { status: 400 }
    );
  }

  const supabase = await createServerSupabaseClient();

  // Verify permission
  const { data: member, error: memberErr } = await supabase
    .from("profile_access_members")
    .select("role, can_manage_appointments")
    .eq("healthcare_profile_id", healthcareProfileId)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE")
    .single();

  if (memberErr || !member || (!member.can_manage_appointments && !["OWNER", "FAMILY_ADMIN"].includes(member.role))) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN", message: "You lack permission to schedule appointments." } },
      { status: 403 }
    );
  }

  const { data: appointment, error: insertErr } = await supabase
    .from("appointments")
    .insert({
      healthcare_profile_id: healthcareProfileId,
      doctor_name: doctorName.trim(),
      specialty: specialty.trim(),
      clinic_name: clinicName.trim(),
      location_or_link: locationOrLink.trim(),
      appointment_time: parsedTime.toISOString(),
      companion_member_id: companionMemberId || null,
      notes: notes?.trim() || null,
      status: "SCHEDULED",
    })
    .select()
    .single();

  if (insertErr || !appointment) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: insertErr?.message || "Failed to create appointment" } },
      { status: 500 }
    );
  }

  // Log to immutable care_activities timeline
  await supabase.from("care_activities").insert({
    healthcare_profile_id: healthcareProfileId,
    actor_id: user.id,
    actor_role: member.role,
    action_type: "APPOINTMENT_SCHEDULED",
    action_payload: {
      appointmentId: appointment.id,
      doctorName: appointment.doctor_name,
      specialty: appointment.specialty,
      clinicName: appointment.clinic_name,
      appointmentTime: appointment.appointment_time,
    },
  });

  return NextResponse.json(
    {
      success: true,
      data: appointment,
      message: "Appointment successfully scheduled.",
    },
    { status: 201 }
  );
}
