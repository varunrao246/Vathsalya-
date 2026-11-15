import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const admin = createAdminClient();

  // 1. Fetch active profile memberships for the authenticated user
  const { data: members, error: memberError } = await admin
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
        doctor_phone,
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

    if (!displayName?.trim() || !dateOfBirth || !emergencyContactName?.trim() || !emergencyContactPhone?.trim()) {
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

    const admin = createAdminClient();
    const assignedRole = isSelf ? "ELDERLY" : "FAMILY_ADMIN";
    const primaryElderId = isSelf ? user.id : null;
    const cleanDisplayName = displayName.trim();
    const cleanEmergencyName = emergencyContactName.trim();
    const cleanEmergencyPhone = emergencyContactPhone.trim();

    // 1. Idempotency Check: Prevent duplicate profiles if user retries after a network or UI pause
    const { data: existingMembers } = await admin
      .from("profile_access_members")
      .select("role, healthcare_profile:healthcare_profiles(*)")
      .eq("profile_id", user.id)
      .eq("status", "ACTIVE");

    const existingList = (existingMembers as unknown as Array<{ role: string; healthcare_profile: Record<string, unknown> | null }>) || [];
    const existingMatch = existingList.find((m) => {
      const p = m.healthcare_profile;
      return (
        p &&
        !p.deleted_at &&
        typeof p.display_name === "string" &&
        p.display_name.trim().toLowerCase() === cleanDisplayName.toLowerCase() &&
        p.date_of_birth === dateOfBirth
      );
    });

    if (existingMatch && existingMatch.healthcare_profile) {
      return NextResponse.json(
        {
          success: true,
          data: {
            ...existingMatch.healthcare_profile,
            role: existingMatch.role || assignedRole,
            isExisting: true,
          },
        },
        { status: 200 }
      );
    }

    // 2. Check for orphaned profiles with same name & DOB from an earlier interrupted attempt
    const { data: orphanProfiles } = await admin
      .from("healthcare_profiles")
      .select("*")
      .ilike("display_name", cleanDisplayName)
      .eq("date_of_birth", dateOfBirth)
      .is("deleted_at", null);

    let activeProfile: Record<string, unknown> | null = null;
    let createdNewProfile = false;

    if (orphanProfiles && orphanProfiles.length > 0) {
      for (const candidate of orphanProfiles) {
        const { data: mems } = await admin
          .from("profile_access_members")
          .select("id")
          .eq("healthcare_profile_id", candidate.id)
          .eq("status", "ACTIVE");

        if (!mems || mems.length === 0) {
          activeProfile = candidate;
          break;
        }
      }
    }

    // 3. If no orphan to recover, create new healthcare profile record
    if (!activeProfile) {
      const profilePayload: Record<string, unknown> = {
        primary_elder_id: primaryElderId,
        display_name: cleanDisplayName,
        date_of_birth: dateOfBirth,
        gender: gender || null,
        blood_group: bloodGroup || null,
        timezone,
        emergency_contact_name: cleanEmergencyName,
        emergency_contact_phone: cleanEmergencyPhone,
        medical_conditions: Array.isArray(medicalConditions) ? medicalConditions : [],
        allergies: Array.isArray(allergies) ? allergies : [],
        doctor_name: doctorName ? doctorName.trim() : null,
        hospital_name: hospitalName ? hospitalName.trim() : null,
        doctor_phone: doctorPhone ? doctorPhone.trim() : null,
      };

      // Try inserting with created_by (when schema migration is active)
      const tryWithCreatedBy = await admin
        .from("healthcare_profiles")
        .insert({ ...profilePayload, created_by: user.id })
        .select()
        .single();

      if (!tryWithCreatedBy.error && tryWithCreatedBy.data) {
        activeProfile = tryWithCreatedBy.data;
        createdNewProfile = true;
      } else {
        // Fallback without created_by if column is not yet in PostgREST schema cache
        const tryWithoutCreatedBy = await admin
          .from("healthcare_profiles")
          .insert(profilePayload)
          .select()
          .single();

        if (tryWithoutCreatedBy.error || !tryWithoutCreatedBy.data) {
          return NextResponse.json(
            {
              success: false,
              error: {
                code: "DB_ERROR",
                message: tryWithoutCreatedBy.error?.message || "Failed to create healthcare profile",
              },
            },
            { status: 500 }
          );
        }
        activeProfile = tryWithoutCreatedBy.data;
        createdNewProfile = true;
      }
    }

    if (!activeProfile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "DB_ERROR",
            message: "Unable to create or locate healthcare profile record.",
          },
        },
        { status: 500 }
      );
    }

    const currentProfile = activeProfile;

    // 4. Atomic Member Binding: Assign user access in profile_access_members
    const { error: memberError } = await admin
      .from("profile_access_members")
      .upsert(
        {
          healthcare_profile_id: currentProfile.id as string,
          profile_id: user.id,
          role: assignedRole,
          can_manage_meds: true,
          can_manage_appointments: true,
          can_confirm_doses: true,
          status: "ACTIVE",
        },
        { onConflict: "healthcare_profile_id,profile_id" }
      );

    if (memberError) {
      // Rollback newly created profile to prevent orphan state
      if (createdNewProfile) {
        await admin.from("healthcare_profiles").delete().eq("id", currentProfile.id as string);
      }
      return NextResponse.json(
        { success: false, error: { code: "MEMBER_BIND_ERROR", message: memberError.message } },
        { status: 500 }
      );
    }

    // 5. Log Care Activity Audit
    await admin.from("care_activities").insert({
      healthcare_profile_id: currentProfile.id as string,
      actor_id: user.id,
      actor_role: assignedRole,
      action_type: "HEALTHCARE_PROFILE_CREATED",
      action_payload: {
        displayName: currentProfile.display_name,
        isSelf,
        role: assignedRole,
        primaryElderId,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          ...currentProfile,
          role: assignedRole,
        },
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "BAD_REQUEST",
          message: err instanceof Error ? err.message : "Invalid payload",
        },
      },
      { status: 400 }
    );
  }
}
