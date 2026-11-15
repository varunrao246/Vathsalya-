-- ==============================================================================
-- VATSALYA (वात्सल्य) — Official Database Migration
-- Migration: 20261115000000_vatsalya_initial_schema.sql
-- Description: 13 Normalized Tables, RLS, Granular Permissions, and Audit Trails
-- ==============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLE: profiles (Account Identity linked 1:1 with auth.users)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en', 'kn', 'hi')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ==============================================================================
-- 2. TABLE: healthcare_profiles (Clinical Healthcare Record for Elderly Individual)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.healthcare_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    primary_elder_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    display_name TEXT NOT NULL,
    date_of_birth DATE NOT NULL,
    gender TEXT CHECK (gender IN ('MALE', 'FEMALE', 'OTHER')),
    blood_group TEXT,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    emergency_contact_name TEXT NOT NULL,
    emergency_contact_phone TEXT NOT NULL,
    medical_conditions JSONB DEFAULT '[]'::jsonb NOT NULL,
    allergies JSONB DEFAULT '[]'::jsonb NOT NULL,
    doctor_name TEXT,
    hospital_name TEXT,
    doctor_phone TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_healthcare_profiles_elder ON public.healthcare_profiles(primary_elder_id);

-- ==============================================================================
-- 3. TABLE: profile_access_members (Role-Based Permissions Mapping)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profile_access_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('ELDERLY', 'FAMILY_ADMIN', 'FAMILY_VIEWER', 'CARETAKER')),
    can_manage_meds BOOLEAN NOT NULL DEFAULT false,
    can_manage_appointments BOOLEAN NOT NULL DEFAULT false,
    can_confirm_doses BOOLEAN NOT NULL DEFAULT true,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INVITED', 'SUSPENDED')),
    joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_member_profile UNIQUE (healthcare_profile_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_access_members_profile ON public.profile_access_members(profile_id);
CREATE INDEX IF NOT EXISTS idx_access_members_healthcare ON public.profile_access_members(healthcare_profile_id);

-- ==============================================================================
-- 4. TABLE: profile_access_invitations (Secure 6-Digit Passcode Invitations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profile_access_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES public.profiles(id),
    hashed_code TEXT NOT NULL,
    invited_role TEXT NOT NULL CHECK (invited_role IN ('FAMILY_ADMIN', 'FAMILY_VIEWER', 'CARETAKER')),
    can_manage_meds BOOLEAN NOT NULL DEFAULT false,
    can_confirm_doses BOOLEAN NOT NULL DEFAULT true,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 5,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_by UUID REFERENCES public.profiles(id),
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_access_invitations_hash ON public.profile_access_invitations(hashed_code);
CREATE INDEX IF NOT EXISTS idx_access_invitations_profile ON public.profile_access_invitations(healthcare_profile_id);

-- ==============================================================================
-- 5. TABLE: medications (Pharmaceutical Master Record)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    generic_name TEXT,
    dosage_strength TEXT NOT NULL,
    dosage_form TEXT NOT NULL CHECK (dosage_form IN ('TABLET', 'CAPSULE', 'SYRUP', 'INJECTION', 'DROPS', 'INHALER', 'OTHER')),
    instructions TEXT,
    prescribing_doctor TEXT,
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    end_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_medications_profile ON public.medications(healthcare_profile_id);

-- ==============================================================================
-- 6. TABLE: medication_schedules (Daily Time Slot Definitions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.medication_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
    target_time TIME NOT NULL,
    meal_timing TEXT NOT NULL CHECK (meal_timing IN ('BEFORE_MEAL', 'WITH_MEAL', 'AFTER_MEAL', 'EMPTY_STOMACH', 'NO_RESTRICTION')),
    dose_quantity NUMERIC NOT NULL DEFAULT 1.0,
    frequency_type TEXT NOT NULL DEFAULT 'DAILY' CHECK (frequency_type IN ('DAILY', 'SPECIFIC_DAYS', 'AS_NEEDED')),
    days_of_week JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
    reminder_minutes_before INTEGER NOT NULL DEFAULT 15,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_schedules_med ON public.medication_schedules(medication_id);

-- ==============================================================================
-- 7. TABLE: dose_logs (Individual Scheduled Dose Occurrences)
-- CRITICAL FIX: Occurrence-specific key replacing UNIQUE(schedule_id, scheduled_date)
-- Supports multiple doses per day and exact timezone-aware occurrences.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.dose_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES public.medication_schedules(id) ON DELETE CASCADE,
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    scheduled_at TIMESTAMPTZ NOT NULL,
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    scheduled_occurrence_key TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('UPCOMING', 'DUE', 'TAKEN', 'OVERDUE', 'MISSED', 'SKIPPED', 'UNCONFIRMED')),
    actor_id UUID REFERENCES public.profiles(id),
    actor_role TEXT CHECK (actor_role IN ('ELDERLY', 'FAMILY_ADMIN', 'FAMILY_VIEWER', 'CARETAKER', 'SYSTEM')),
    recorded_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    notes TEXT,
    CONSTRAINT uq_schedule_occurrence UNIQUE (schedule_id, scheduled_at)
);

CREATE INDEX IF NOT EXISTS idx_dose_logs_lookup ON public.dose_logs(healthcare_profile_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_dose_logs_schedule ON public.dose_logs(schedule_id, scheduled_at);

-- ==============================================================================
-- 8. TABLE: appointments (Doctor Appointments & Consultations)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    doctor_name TEXT NOT NULL,
    specialty TEXT NOT NULL,
    clinic_name TEXT NOT NULL,
    location_or_link TEXT NOT NULL,
    appointment_time TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    companion_member_id UUID REFERENCES public.profiles(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_appointments_profile ON public.appointments(healthcare_profile_id, appointment_time);

-- ==============================================================================
-- 9. TABLE: device_tokens (Channel A: Android FCM Push Notification Ready)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL UNIQUE,
    device_type TEXT NOT NULL DEFAULT 'ANDROID',
    device_name TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_seen_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_device_tokens_profile ON public.device_tokens(profile_id);

-- ==============================================================================
-- 10. TABLE: telegram_links (Channel B: Verified Telegram Bot Chat Links)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.telegram_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    telegram_chat_id TEXT NOT NULL UNIQUE,
    telegram_username TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    link_token TEXT UNIQUE,
    link_token_expires_at TIMESTAMPTZ,
    linked_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_telegram_links_profile ON public.telegram_links(profile_id);

-- ==============================================================================
-- 11. TABLE: notifications (Unified Deduplication & Multi-Channel Audit)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    idempotency_key TEXT NOT NULL UNIQUE,
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    recipient_identifier TEXT NOT NULL,
    delivery_channel TEXT NOT NULL CHECK (delivery_channel IN ('ANDROID_FCM', 'TELEGRAM', 'EMAIL')),
    notification_type TEXT NOT NULL CHECK (notification_type IN ('UPCOMING_DOSE', 'OVERDUE_DOSE', 'MISSED_DOSE', 'UPCOMING_APPOINTMENT', 'ESCALATION_ALERT')),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'SKIPPED')),
    provider_message_id TEXT,
    dispatched_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_idempotency ON public.notifications(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_notifications_profile ON public.notifications(healthcare_profile_id);

-- ==============================================================================
-- 12. TABLE: care_activities (Immutable Audit Log for All Actions)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.care_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id),
    actor_role TEXT NOT NULL,
    action_type TEXT NOT NULL,
    action_payload JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_care_activities_timeline ON public.care_activities(healthcare_profile_id, created_at DESC);

-- ==============================================================================
-- 13. TABLE: care_insights (AI Daily Briefs & Adherence Summaries Cache)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.care_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL CHECK (insight_type IN ('DAILY_BRIEF', 'WEEKLY_ADHERENCE', 'HANDOVER_SUMMARY')),
    summary_text TEXT NOT NULL,
    adherence_rate NUMERIC,
    key_observations JSONB DEFAULT '[]'::jsonb,
    generated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_care_insights_cache ON public.care_insights(healthcare_profile_id, insight_type, expires_at);

-- ==============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS (Safe search_path, Non-Recursive)
-- ==============================================================================

-- 1. Check if authenticated caller has active membership in healthcare profile
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
    );
$$;

-- 2. Check if caller has specific granular permission
CREATE OR REPLACE FUNCTION public.has_healthcare_permission(
    target_profile_id UUID,
    required_permission TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_role TEXT;
    v_can_manage_meds BOOLEAN;
    v_can_manage_appts BOOLEAN;
    v_can_confirm_doses BOOLEAN;
BEGIN
    SELECT role, can_manage_meds, can_manage_appointments, can_confirm_doses
    INTO v_role, v_can_manage_meds, v_can_manage_appts, v_can_confirm_doses
    FROM public.profile_access_members
    WHERE healthcare_profile_id = target_profile_id
      AND profile_id = auth.uid()
      AND status = 'ACTIVE';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    -- Elderly owner and Family Admin have full domain management
    IF v_role IN ('ELDERLY', 'FAMILY_ADMIN') THEN
        RETURN TRUE;
    END IF;

    -- Granular permission evaluation
    CASE required_permission
        WHEN 'MANAGE_MEDS' THEN
            RETURN v_can_manage_meds;
        WHEN 'MANAGE_APPOINTMENTS' THEN
            RETURN v_can_manage_appts;
        WHEN 'CONFIRM_DOSES' THEN
            RETURN v_can_confirm_doses;
        WHEN 'VIEW_ONLY' THEN
            RETURN TRUE;
        ELSE
            RETURN FALSE;
    END CASE;
END;
$$;

-- 3. Check if caller is owner or admin (for invites and revocations)
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
    );
$$;

-- Restrict function execution permissions
REVOKE ALL ON FUNCTION public.has_healthcare_access(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_healthcare_access(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.has_healthcare_permission(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_healthcare_permission(UUID, TEXT) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.is_profile_owner_or_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_profile_owner_or_admin(UUID) TO authenticated, service_role;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES ON ALL 13 TABLES
-- ==============================================================================

-- 1. profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own profile or peers with shared healthcare profile"
ON public.profiles FOR SELECT
USING (
    id = auth.uid() OR
    id IN (
        SELECT pam2.profile_id
        FROM public.profile_access_members pam1
        JOIN public.profile_access_members pam2 ON pam1.healthcare_profile_id = pam2.healthcare_profile_id
        WHERE pam1.profile_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid());

-- 2. healthcare_profiles
ALTER TABLE public.healthcare_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authorized members can read healthcare profile"
ON public.healthcare_profiles FOR SELECT
USING (public.has_healthcare_access(id) AND deleted_at IS NULL);

CREATE POLICY "Authenticated users can create healthcare profiles"
ON public.healthcare_profiles FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Owners and Family Admins can update healthcare profile"
ON public.healthcare_profiles FOR UPDATE
USING (public.is_profile_owner_or_admin(id));

-- 3. profile_access_members
ALTER TABLE public.profile_access_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view other members in their healthcare profile"
ON public.profile_access_members FOR SELECT
USING (public.has_healthcare_access(healthcare_profile_id));

CREATE POLICY "Owners and Family Admins can manage members"
ON public.profile_access_members FOR ALL
USING (public.is_profile_owner_or_admin(healthcare_profile_id));

-- 4. profile_access_invitations
ALTER TABLE public.profile_access_invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners and Family Admins can view and manage invitations"
ON public.profile_access_invitations FOR ALL
USING (public.is_profile_owner_or_admin(healthcare_profile_id));

-- 5. medications
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view active medications"
ON public.medications FOR SELECT
USING (public.has_healthcare_access(healthcare_profile_id) AND deleted_at IS NULL);

CREATE POLICY "Authorized members can modify medications"
ON public.medications FOR ALL
USING (public.has_healthcare_permission(healthcare_profile_id, 'MANAGE_MEDS'));

-- 6. medication_schedules
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view medication schedules"
ON public.medication_schedules FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.medications m
        WHERE m.id = medication_id
          AND public.has_healthcare_access(m.healthcare_profile_id)
    )
);

CREATE POLICY "Authorized members can manage medication schedules"
ON public.medication_schedules FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.medications m
        WHERE m.id = medication_id
          AND public.has_healthcare_permission(m.healthcare_profile_id, 'MANAGE_MEDS')
    )
);

-- 7. dose_logs
ALTER TABLE public.dose_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view dose logs"
ON public.dose_logs FOR SELECT
USING (public.has_healthcare_access(healthcare_profile_id));

CREATE POLICY "Authorized members can record dose status"
ON public.dose_logs FOR INSERT
WITH CHECK (
    public.has_healthcare_access(healthcare_profile_id) AND
    public.has_healthcare_permission(healthcare_profile_id, 'CONFIRM_DOSES')
);

CREATE POLICY "Authorized members can update dose status"
ON public.dose_logs FOR UPDATE
USING (
    public.has_healthcare_access(healthcare_profile_id) AND
    public.has_healthcare_permission(healthcare_profile_id, 'CONFIRM_DOSES')
);

-- 8. appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view appointments"
ON public.appointments FOR SELECT
USING (public.has_healthcare_access(healthcare_profile_id) AND deleted_at IS NULL);

CREATE POLICY "Authorized members can manage appointments"
ON public.appointments FOR ALL
USING (public.has_healthcare_permission(healthcare_profile_id, 'MANAGE_APPOINTMENTS'));

-- 9. device_tokens
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own device tokens"
ON public.device_tokens FOR ALL
USING (profile_id = auth.uid());

-- 10. telegram_links
ALTER TABLE public.telegram_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own telegram link"
ON public.telegram_links FOR ALL
USING (profile_id = auth.uid());

-- 11. notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view their notifications"
ON public.notifications FOR SELECT
USING (public.has_healthcare_access(healthcare_profile_id));

-- 12. care_activities
ALTER TABLE public.care_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view care activity timeline"
ON public.care_activities FOR SELECT
USING (public.has_healthcare_access(healthcare_profile_id));

CREATE POLICY "Active members can insert activity logs"
ON public.care_activities FOR INSERT
WITH CHECK (public.has_healthcare_access(healthcare_profile_id));

-- 13. care_insights
ALTER TABLE public.care_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view cached care insights"
ON public.care_insights FOR SELECT
USING (public.has_healthcare_access(healthcare_profile_id));

-- ==============================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON auth.users SIGNUP
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, preferred_language)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'en')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
