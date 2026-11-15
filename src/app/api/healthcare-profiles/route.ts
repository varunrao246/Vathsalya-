import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const supabase = await createServerSupabaseClient();
  // Fetch profiles where user is an active member
  const { data: members, error: memberError } = await supabase
    .from("profile_access_members")
    .select(`
      id,
      role,
      can_manage_meds,
      can_manage_appointments,
      can_confirm_doses,
      healthcare_profile:healthcare_profiles (
        id,
        primary_elder_id,
        display_name,
        date_of_birth,
        gender,
        blood_group,
        timezone,
        emergency_contact_name,
        emergency_contact_phone,
        medical_conditions,
        allergies,
        doctor_name,
        hospital_name,
        created_at
      )
    `)
    .eq("profile_id", user.id)
    .eq("status", "ACTIVE");

  if (memberError) {
    return NextResponse.json(
      { success: false, error: { code: "DB_ERROR", message: memberError.message } },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, data: members || [] }, { status: 200 });
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
      displayName,
      dateOfBirth,
      gender,
      bloodGroup,
      timezone = "Asia/Kolkata",
      emergencyContactName,
      emergencyContactPhone,
      medicalConditions = [],
      allergies = [],
      doctorName,
      hospitalName,
      doctorPhone,
      isSelf = false,
    } = body;

    if (!displayName || !dateOfBirth || !emergencyContactName || !emergencyContactPhone) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "displayName, dateOfBirth, emergencyContactName, and emergencyContactPhone are required.",
          },
        },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // 1. Insert healthcare profile
    const { data: newProfile, error: profileError } = await supabase
      .from("healthcare_profiles")
      .insert({
        primary_elder_id: isSelf ? user.id : null,
        display_name: displayName.trim(),
        date_of_birth: dateOfBirth,
        gender: gender || null,
        blood_group: bloodGroup || null,
        timezone,
        emergency_contact_name: emergencyContactName.trim(),
        emergency_contact_phone: emergencyContactPhone.trim(),
        medical_conditions: Array.isArray(medicalConditions) ? medicalConditions : [],
        allergies: Array.isArray(allergies) ? allergies : [],
        doctor_name: doctorName ? doctorName.trim() : null,
        hospital_name: hospitalName ? hospitalName.trim() : null,
        doctor_phone: doctorPhone ? doctorPhone.trim() : null,
      })
      .select()
      .single();

    if (profileError || !newProfile) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: profileError?.message || "Failed to create profile" } },
        { status: 500 }
      );
    }

    // 2. Insert creator into profile_access_members
    const assignedRole = isSelf ? "ELDERLY" : "FAMILY_ADMIN";
    const { error: memberError } = await supabase.from("profile_access_members").insert({
      healthcare_profile_id: newProfile.id,
      profile_id: user.id,
      role: assignedRole,
      can_manage_meds: true,
      can_manage_appointments: true,
      can_confirm_doses: true,
      status: "ACTIVE",
    });

    if (memberError) {
      return NextResponse.json(
        { success: false, error: { code: "MEMBER_BIND_ERROR", message: memberError.message } },
        { status: 500 }
      );
    }

    // 3. Log audit activity
    await supabase.from("care_activities").insert({
      healthcare_profile_id: newProfile.id,
      actor_id: user.id,
      actor_role: assignedRole,
      action_type: "HEALTHCARE_PROFILE_CREATED",
      action_payload: { displayName: newProfile.display_name, isSelf },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...newProfile,
          role: assignedRole,
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
