# VATSALYA (वात्सल्य) — Hackathon Implementation Plan & Milestone Roadmap

> **Target Goal:** Deliver a competition-winning, production-deployed MVP of VATSALYA within a strict one-day hackathon timeline. Prioritizes deployability from hour one, deterministic healthcare logic, multi-role security, and the three unified notification channels (Android FCM ready, Telegram Bot, Resend Email).

---

## 1. Hackathon Timeline & Milestone Schedule

```mermaid
gantt
    title VATSALYA Hackathon Implementation Roadmap (1-Day Cadence)
    dateFormat  X
    axisFormat %s

    section Foundation & Early Deploy
    M1: Scaffold, Dockerfile & Early Cloud Run Deploy :0, 2
    M2: Supabase PostgreSQL, RLS & Authentication     :2, 4

    section Healthcare Core (P0)
    M3: Healthcare Profiles & Passcode Access Flow   :4, 6
    M4: Medication Schedules & Dose State Machine    :6, 9
    M5: Doctor Appointments & Care Activity Feed     :9, 11

    section Notification Channels
    M6: Telegram Bot Integration (Interactive Webhook):11, 13
    M7: Resend Email Engine & Cloud Scheduler        :13, 15

    section Interfaces & Experience
    M8: Elderly Accessible Dashboard (WCAG 2.2 AA)   :15, 18
    M9: Android Notification-Ready APIs (FCM)        :18, 19
    M10: Google Gemini AI Daily Care Brief (P1)      :19, 21

    section Testing & Final Polish
    M11: Vitest, Playwright & Final Cloud Run Verify :21, 24
```

---

## 2. Milestone Breakdown & Measurable Acceptance Criteria

### Milestone 1: Scaffold, Dockerfile & Early Cloud Run Deploy
- **Duration:** 2 Hours
- **Priority:** P0 (Foundational)
- **Tasks:**
  1. Initialize Next.js 15 application with TypeScript, Tailwind CSS, and shadcn/ui.
  2. Implement multi-stage Dockerfile (`output: 'standalone'`).
  3. Create `/api/health` route returning `{ status: 'healthy', uptime }`.
  4. Perform initial deployment checkpoint to Google Cloud Run to guarantee deployment pipeline health.
- **Acceptance Criteria:**
  - `npm run build` succeeds locally without warnings.
  - Early Cloud Run URL responds with HTTP 200 at `/api/health`.

### Milestone 2: Supabase PostgreSQL, RLS & Authentication
- **Duration:** 2 Hours
- **Priority:** P0 (Data & Security)
- **Tasks:**
  1. Deploy SQL migration script creating all 13 tables: `profiles`, `healthcare_profiles`, `profile_access_members`, `profile_access_invitations`, `medications`, `medication_schedules`, `dose_logs`, `appointments`, `device_tokens`, `telegram_links`, `notifications`, `care_activities`, `care_insights`.
  2. Implement `has_healthcare_access` security definer function and RLS policies.
  3. Configure Supabase Auth client and `/api/auth/profile` onboarding handler.
- **Acceptance Criteria:**
  - User can register with email, password, phone, and preferred language.
  - RLS blocks any query without active membership.

### Milestone 3: Healthcare Profiles & Passcode-Based Access Flow
- **Duration:** 2 Hours
- **Priority:** P0 (Core Challenge Requirement)
- **Tasks:**
  1. Healthcare profile creation flow (`POST /api/healthcare-profiles`) supporting both self-creation and family managing on behalf.
  2. Passcode invitation generator (`POST /api/profile-access/invite`) generating 6-digit SHA-256 hashed code with 48h TTL.
  3. Passcode redemption endpoint (`POST /api/profile-access/redeem`) binding user to profile with assigned role.
  4. Access list and one-tap revocation view.
- **Acceptance Criteria:**
  - Family member entering valid 6-digit code is granted access and assigned role.
  - Expired (>48h) or reused codes return HTTP 400 Bad Request.

### Milestone 4: Medication Schedules & Deterministic Dose State Machine
- **Duration:** 3 Hours
- **Priority:** P0 (Core Healthcare Adherence)
- **Tasks:**
  1. Medication CRUD with multi-slot daily schedules (target times, meal contexts, start/end dates).
  2. Daily timeline evaluation (`GET /api/doses/today`) distinguishing `UPCOMING`, `DUE`, `TAKEN`, `OVERDUE`, `MISSED`, `SKIPPED`, `UNCONFIRMED`.
  3. Idempotent dose confirmation endpoint (`POST /api/doses/confirm`) backed by unique constraint on `(schedule_id, scheduled_date)`.
- **Acceptance Criteria:**
  - `TAKEN` and `OVERDUE` operate as alternative execution outcomes from `DUE`.
  - Rapid double-clicks return HTTP 409 Conflict with original confirmation audit.

### Milestone 5: Doctor Appointments & Care Activity History
- **Duration:** 2 Hours
- **Priority:** P0 (Clinical Appointments)
- **Tasks:**
  1. Appointment CRUD (`/api/appointments`) with clinic details, specialty, date/time, and companion member tag.
  2. Care activity audit logger (`/api/care-activities`) tracking dose confirmations, schedule changes, and member access.
- **Acceptance Criteria:**
  - Appointments sorted chronologically with upcoming/past views.
  - Activity feed reflects real-time updates via Supabase Realtime.

### Milestone 6: Interactive Telegram Bot Integration (Channel B)
- **Duration:** 2 Hours
- **Priority:** P0 (Delivery Channel B)
- **Tasks:**
  1. Implement Telegram webhook handler (`POST /api/telegram/webhook`) validating `X-Telegram-Bot-Api-Secret-Token`.
  2. Build deep linking account connection (`t.me/VatsalyaCareBot?start=<TOKEN>`) storing verified `telegram_chat_id`.
  3. Implement interactive dose reminder messages with inline buttons: `[ ✅ Taken ]`, `[ ⏰ Remind me later ]`, `[ 🆘 Need help ]`.
  4. Handle callback query to confirm dose in database and update Telegram message.
- **Acceptance Criteria:**
  - Tapping `[ ✅ Taken ]` in Telegram updates dose status in Supabase and edits message to show green checkmark.

### Milestone 7: Resend Email Engine & Google Cloud Scheduler (Channel C)
- **Duration:** 2 Hours
- **Priority:** P0 (Delivery Channel C)
- **Tasks:**
  1. Implement protected notification job runner (`POST /api/jobs/notifications`) secured via Bearer token (`CRON_SECRET`).
  2. Resend email integration with high-contrast, accessible HTML templates.
  3. Idempotent deduplication store in `notifications` table.
  4. Google Cloud Scheduler 10-minute cron configuration.
- **Acceptance Criteria:**
  - Due and overdue doses trigger exactly one email per reminder window.
  - Retried executions produce 0 duplicate emails.

### Milestone 8: Elderly-Friendly Accessible Dashboard (WCAG 2.2 AA)
- **Duration:** 3 Hours
- **Priority:** P0 (Accessibility & UX)
- **Tasks:**
  1. Build dedicated Elderly Home View: $24\text{ px}+$ senior typography, $56\text{ px}+$ touch targets, forest green/warm cream palette.
  2. Large "Mark as Taken" action with haptic vibration and audio feedback.
  3. One-tap emergency call button.
  4. Bilingual English / Kannada switcher.
- **Acceptance Criteria:**
  - Zero axe-core accessibility violations.
  - Full keyboard navigation support.

### Milestone 9: Android Notification-Ready APIs & FCM Design (Channel A)
- **Duration:** 1 Hour
- **Priority:** P0 (Delivery Channel A Readiness)
- **Tasks:**
  1. Implement `POST /api/notifications/devices` and `DELETE /api/notifications/devices` for FCM device tokens.
  2. Add FCM push dispatch block into the shared notification runner.
  3. Document Android notification payload schema.
- **Acceptance Criteria:**
  - Endpoint successfully registers device tokens in `device_tokens` table.
  - Dispatch engine logs FCM notification attempts in `notifications` table.

### Milestone 10: Google Gemini AI Daily Care Brief (P1 Differentiating)
- **Duration:** 2 Hours
- **Priority:** P1 (AI Intelligence)
- **Tasks:**
  1. Server-side Gemini 1.5 Flash client with strict non-diagnostic system instruction.
  2. PII sanitization pipeline and caching in `care_insights`.
  3. Deterministic template fallback on timeout or error.
- **Acceptance Criteria:**
  - Natural-language 3-bullet summary generated without medical diagnosing or prescription altering.

### Milestone 11: Comprehensive Testing & Final Cloud Run Deployment
- **Duration:** 3 Hours
- **Priority:** P0 (Verification & Release)
- **Tasks:**
  1. Execute Vitest unit and integration suites.
  2. Run Playwright E2E tests for onboarding, passcode redemption, and dose confirmation.
  3. Perform final Cloud Run deployment update and register Cloud Scheduler job.
  4. Verify live production URL on mobile device.
- **Acceptance Criteria:**
  - 100% test pass rate.
  - Public Cloud Run URL operational and verified.
