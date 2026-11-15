-- ==============================================================================
-- VATSALYA (वात्सल्य) — Milestone 5 Database Migration
-- Notification Reliability, Telegram Linking Tokens & Smart Care Escalations
-- ==============================================================================

-- 1. TABLE: telegram_linking_tokens
-- Stores short-lived, single-use cryptographically secure linking tokens.
CREATE TABLE IF NOT EXISTS public.telegram_linking_tokens (
    token TEXT PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_tg_tokens_profile ON public.telegram_linking_tokens(profile_id);
CREATE INDEX IF NOT EXISTS idx_tg_tokens_expires ON public.telegram_linking_tokens(expires_at);

-- 2. TABLE: notification_preferences
-- Role-aware notification delivery preferences per healthcare profile.
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    telegram_enabled BOOLEAN DEFAULT true NOT NULL,
    email_enabled BOOLEAN DEFAULT true NOT NULL,
    reminder_minutes_before INTEGER DEFAULT 15 NOT NULL,
    overdue_caretaker_grace_minutes INTEGER DEFAULT 30 NOT NULL,
    family_escalation_grace_minutes INTEGER DEFAULT 60 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_healthcare_profile_user_pref UNIQUE (healthcare_profile_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_notif_pref_lookup ON public.notification_preferences(healthcare_profile_id, profile_id);

-- 3. TABLE: escalation_events
-- Tracks deterministic caretaker & family escalation follow-up workflows.
CREATE TABLE IF NOT EXISTS public.escalation_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    healthcare_profile_id UUID NOT NULL REFERENCES public.healthcare_profiles(id) ON DELETE CASCADE,
    schedule_occurrence_key TEXT NOT NULL,
    medication_name TEXT NOT NULL,
    target_time TIME NOT NULL,
    scheduled_at TIMESTAMPTZ NOT NULL,
    escalation_level TEXT NOT NULL CHECK (escalation_level IN ('CARETAKER_OVERDUE', 'FAMILY_ADMIN_ALERT')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'RESOLVED', 'DISMISSED')),
    assigned_caretaker_id UUID REFERENCES public.profiles(id),
    resolution_action TEXT CHECK (resolution_action IN (
        'CALL_COMPLETED',
        'DOSE_CONFIRMED_BY_ELDER',
        'ADMINISTERED_BY_CARETAKER',
        'ELDER_REPORTS_ALREADY_TAKEN',
        'ASSISTANCE_REQUIRED',
        'UNABLE_TO_REACH',
        'FOLLOW_UP_PENDING'
    )),
    resolution_notes TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT uq_occurrence_escalation_level UNIQUE (schedule_occurrence_key, escalation_level)
);

CREATE INDEX IF NOT EXISTS idx_escalation_profile ON public.escalation_events(healthcare_profile_id, status);
CREATE INDEX IF NOT EXISTS idx_escalation_key ON public.escalation_events(schedule_occurrence_key);

-- 4. EXTEND TABLE: notifications
-- Add retry tracking, processing lock and error metadata to unified notifications table.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0 NOT NULL;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS error_message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS payload JSONB DEFAULT '{}'::jsonb;

-- Update notification status constraint to support PROCESSING state for atomic claiming
DO $$
BEGIN
    ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_status_check;
    ALTER TABLE public.notifications ADD CONSTRAINT notifications_status_check
        CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 5. FUNCTION: claim_notification_for_processing
-- Atomic, database-level locking and claiming of notifications to prevent concurrent workers from sending duplicate alerts.
CREATE OR REPLACE FUNCTION public.claim_notification_for_processing(
    p_idempotency_key TEXT,
    p_healthcare_profile_id UUID,
    p_recipient_identifier TEXT,
    p_delivery_channel TEXT,
    p_notification_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_stale_lock_seconds INTEGER DEFAULT 300
) RETURNS TABLE (
    claimed BOOLEAN,
    notification_id UUID,
    current_status TEXT,
    reason TEXT
) LANGUAGE plpgsql AS $$
DECLARE
    v_row public.notifications%ROWTYPE;
BEGIN
    -- 1. Try to insert new record with status PROCESSING atomically
    INSERT INTO public.notifications (
        idempotency_key,
        healthcare_profile_id,
        recipient_identifier,
        delivery_channel,
        notification_type,
        title,
        message,
        status,
        locked_at,
        dispatched_at,
        retry_count
    ) VALUES (
        p_idempotency_key,
        p_healthcare_profile_id,
        p_recipient_identifier,
        p_delivery_channel,
        p_notification_type,
        p_title,
        p_message,
        'PROCESSING',
        now(),
        now(),
        0
    )
    ON CONFLICT (idempotency_key) DO NOTHING
    RETURNING * INTO v_row;

    IF FOUND THEN
        RETURN QUERY SELECT true, v_row.id, v_row.status, 'CLAIMED_NEW'::TEXT;
        RETURN;
    END IF;

    -- 2. If row already exists, acquire exclusive row lock
    SELECT * INTO v_row FROM public.notifications WHERE idempotency_key = p_idempotency_key FOR UPDATE;

    -- Already successfully sent -> do not send again
    IF v_row.status = 'SENT' THEN
        RETURN QUERY SELECT false, v_row.id, v_row.status, 'ALREADY_SENT'::TEXT;
        RETURN;
    END IF;

    -- Actively locked by another worker within the stale threshold -> do not steal
    IF v_row.status = 'PROCESSING' AND v_row.locked_at IS NOT NULL AND v_row.locked_at > (now() - (p_stale_lock_seconds || ' seconds')::interval) THEN
        RETURN QUERY SELECT false, v_row.id, v_row.status, 'CONCURRENT_LOCK_ACTIVE'::TEXT;
        RETURN;
    END IF;

    -- Stale lock or previously failed -> claim for retry with incremented retry count
    UPDATE public.notifications
    SET status = 'PROCESSING',
        locked_at = now(),
        retry_count = v_row.retry_count + 1
    WHERE id = v_row.id
    RETURNING * INTO v_row;

    RETURN QUERY SELECT true, v_row.id, v_row.status, 'CLAIMED_FOR_RETRY'::TEXT;
    RETURN;
END;
$$;
