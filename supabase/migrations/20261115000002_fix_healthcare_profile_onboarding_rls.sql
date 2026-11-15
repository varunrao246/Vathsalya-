-- ==============================================================================
-- VATSALYA (वात्सल्य) — Migration 20261115000002
-- Fix Healthcare Profile Onboarding RLS, Ownership Separation & Idempotency
-- ==============================================================================

-- 1. ADD created_by COLUMN TO healthcare_profiles
-- Decouples profile creator/administrator (e.g. adult child) from patient identity (primary_elder_id)
ALTER TABLE public.healthcare_profiles
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_healthcare_profiles_created_by
ON public.healthcare_profiles(created_by);

-- 2. BACKFILL EXISTING PROFILES
-- Ensure any existing profile points created_by to primary_elder_id or active family admin
UPDATE public.healthcare_profiles
SET created_by = primary_elder_id
WHERE created_by IS NULL AND primary_elder_id IS NOT NULL;

UPDATE public.healthcare_profiles hp
SET created_by = pam.profile_id
FROM public.profile_access_members pam
WHERE hp.id = pam.healthcare_profile_id
  AND hp.created_by IS NULL
  AND pam.role IN ('ELDERLY', 'FAMILY_ADMIN')
  AND pam.status = 'ACTIVE';

-- 3. UPDATE RLS HELPER: has_healthcare_access
-- Checks active membership in profile_access_members OR creator ownership
CREATE OR REPLACE FUNCTION public.has_healthcare_access(target_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profile_access_members pam
        WHERE pam.healthcare_profile_id = target_profile_id
          AND pam.profile_id = auth.uid()
          AND pam.status = 'ACTIVE'
    ) OR EXISTS (
        SELECT 1
        FROM public.healthcare_profiles hp
        WHERE hp.id = target_profile_id
          AND (hp.created_by = auth.uid() OR hp.primary_elder_id = auth.uid())
          AND hp.deleted_at IS NULL
    );
$$;

-- 4. UPDATE RLS HELPER: is_profile_owner_or_admin
-- Checks if caller is active ELDERLY/FAMILY_ADMIN member OR profile creator
CREATE OR REPLACE FUNCTION public.is_profile_owner_or_admin(target_profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profile_access_members pam
        WHERE pam.healthcare_profile_id = target_profile_id
          AND pam.profile_id = auth.uid()
          AND pam.role IN ('ELDERLY', 'FAMILY_ADMIN')
          AND pam.status = 'ACTIVE'
    ) OR EXISTS (
        SELECT 1
        FROM public.healthcare_profiles hp
        WHERE hp.id = target_profile_id
          AND (hp.created_by = auth.uid() OR hp.primary_elder_id = auth.uid())
          AND hp.deleted_at IS NULL
    );
$$;

REVOKE ALL ON FUNCTION public.has_healthcare_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_healthcare_access(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_profile_owner_or_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_owner_or_admin(UUID) TO authenticated, service_role;

-- 5. UPDATE POLICIES ON healthcare_profiles
DROP POLICY IF EXISTS "Authorized members can read healthcare profile" ON public.healthcare_profiles;
CREATE POLICY "Authorized members can read healthcare profile"
ON public.healthcare_profiles FOR SELECT
USING (
    (public.has_healthcare_access(id) OR created_by = auth.uid() OR primary_elder_id = auth.uid())
    AND deleted_at IS NULL
);

DROP POLICY IF EXISTS "Authenticated users can create healthcare profiles" ON public.healthcare_profiles;
CREATE POLICY "Authenticated users can create healthcare profiles"
ON public.healthcare_profiles FOR INSERT
WITH CHECK (
    auth.uid() IS NOT NULL
    AND (created_by IS NULL OR created_by = auth.uid())
);

DROP POLICY IF EXISTS "Owners and Family Admins can update healthcare profile" ON public.healthcare_profiles;
CREATE POLICY "Owners and Family Admins can update healthcare profile"
ON public.healthcare_profiles FOR UPDATE
USING (
    public.is_profile_owner_or_admin(id)
    OR created_by = auth.uid()
    OR primary_elder_id = auth.uid()
);

-- 6. UPDATE POLICIES ON profile_access_members
DROP POLICY IF EXISTS "Owners and Family Admins can manage members" ON public.profile_access_members;
CREATE POLICY "Owners and Family Admins can manage members"
ON public.profile_access_members FOR ALL
USING (
    public.is_profile_owner_or_admin(healthcare_profile_id)
);

DROP POLICY IF EXISTS "Initial creator can insert self as access member" ON public.profile_access_members;
CREATE POLICY "Initial creator can insert self as access member"
ON public.profile_access_members FOR INSERT
WITH CHECK (
    -- User binding themselves to a profile they created
    (
        profile_id = auth.uid()
        AND EXISTS (
            SELECT 1 FROM public.healthcare_profiles hp
            WHERE hp.id = healthcare_profile_id
              AND (hp.created_by = auth.uid() OR hp.primary_elder_id = auth.uid())
        )
    )
    OR public.is_profile_owner_or_admin(healthcare_profile_id)
);

-- 7. ATOMIC TRANSACTION FUNCTION: create_healthcare_profile
-- Eliminates multi-query client RLS race conditions and ensures complete rollback on failure
CREATE OR REPLACE FUNCTION public.create_healthcare_profile(
    p_display_name TEXT,
    p_date_of_birth DATE,
    p_gender TEXT DEFAULT NULL,
    p_blood_group TEXT DEFAULT NULL,
    p_timezone TEXT DEFAULT 'Asia/Kolkata',
    p_emergency_contact_name TEXT DEFAULT '',
    p_emergency_contact_phone TEXT DEFAULT '',
    p_medical_conditions JSONB DEFAULT '[]'::jsonb,
    p_allergies JSONB DEFAULT '[]'::jsonb,
    p_doctor_name TEXT DEFAULT NULL,
    p_hospital_name TEXT DEFAULT NULL,
    p_doctor_phone TEXT DEFAULT NULL,
    p_is_self BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_profile_id UUID;
    v_primary_elder_id UUID;
    v_assigned_role TEXT;
    v_existing_profile_id UUID;
    v_result JSONB;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required' USING ERRCODE = '42501';
    END IF;

    -- Idempotency check: see if active profile with identical name & DOB exists for this user
    SELECT hp.id INTO v_existing_profile_id
    FROM public.healthcare_profiles hp
    JOIN public.profile_access_members pam ON pam.healthcare_profile_id = hp.id
    WHERE pam.profile_id = v_user_id
      AND pam.status = 'ACTIVE'
      AND hp.deleted_at IS NULL
      AND LOWER(TRIM(hp.display_name)) = LOWER(TRIM(p_display_name))
      AND hp.date_of_birth = p_date_of_birth
    LIMIT 1;

    IF v_existing_profile_id IS NOT NULL THEN
        SELECT to_jsonb(hp.*) || jsonb_build_object('role', pam.role, 'is_existing', true)
        INTO v_result
        FROM public.healthcare_profiles hp
        JOIN public.profile_access_members pam ON pam.healthcare_profile_id = hp.id
        WHERE hp.id = v_existing_profile_id AND pam.profile_id = v_user_id;

        RETURN v_result;
    END IF;

    -- Decouple creator ownership from patient identity
    IF p_is_self THEN
        v_primary_elder_id := v_user_id;
        v_assigned_role := 'ELDERLY';
    ELSE
        v_primary_elder_id := NULL;
        v_assigned_role := 'FAMILY_ADMIN';
    END IF;

    -- Insert into healthcare_profiles
    INSERT INTO public.healthcare_profiles (
        created_by,
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
        doctor_phone
    ) VALUES (
        v_user_id,
        v_primary_elder_id,
        TRIM(p_display_name),
        p_date_of_birth,
        p_gender,
        p_blood_group,
        COALESCE(p_timezone, 'Asia/Kolkata'),
        TRIM(p_emergency_contact_name),
        TRIM(p_emergency_contact_phone),
        COALESCE(p_medical_conditions, '[]'::jsonb),
        COALESCE(p_allergies, '[]'::jsonb),
        NULLIF(TRIM(p_doctor_name), ''),
        NULLIF(TRIM(p_hospital_name), ''),
        NULLIF(TRIM(p_doctor_phone), '')
    )
    RETURNING id INTO v_profile_id;

    -- Atomic Member Binding
    INSERT INTO public.profile_access_members (
        healthcare_profile_id,
        profile_id,
        role,
        can_manage_meds,
        can_manage_appointments,
        can_confirm_doses,
        status
    ) VALUES (
        v_profile_id,
        v_user_id,
        v_assigned_role,
        true,
        true,
        true,
        'ACTIVE'
    )
    ON CONFLICT (healthcare_profile_id, profile_id)
    DO UPDATE SET
        role = EXCLUDED.role,
        status = 'ACTIVE',
        can_manage_meds = true,
        can_manage_appointments = true,
        can_confirm_doses = true;

    -- Audit activity log
    INSERT INTO public.care_activities (
        healthcare_profile_id,
        actor_id,
        actor_role,
        action_type,
        action_payload
    ) VALUES (
        v_profile_id,
        v_user_id,
        v_assigned_role,
        'HEALTHCARE_PROFILE_CREATED',
        jsonb_build_object(
            'display_name', p_display_name,
            'is_self', p_is_self,
            'role', v_assigned_role,
            'primary_elder_id', v_primary_elder_id
        )
    );

    -- Build return payload
    SELECT to_jsonb(hp.*) || jsonb_build_object('role', v_assigned_role, 'is_existing', false)
    INTO v_result
    FROM public.healthcare_profiles hp
    WHERE hp.id = v_profile_id;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.create_healthcare_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_healthcare_profile TO authenticated, service_role;
