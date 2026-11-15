# VATSALYA (वात्सल्य) — Technical Architecture Specification

> **Architectural Tenet:** Modular monolith built on Next.js 15, containerized on Google Cloud Run. Strict separation between account identity and healthcare profile identity. Shared deterministic notification engine servicing three delivery channels: Android Push (FCM), Telegram Bot, and Resend Email.

---

## 1. High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientChannels ["Client Channels & User Interfaces"]
        ElderlyWeb["Elderly High-Contrast Web Dashboard"]
        FamilyWeb["Family Member Collaborative Dashboard"]
        CaretakerWeb["Caretaker Shift Handover Dashboard"]
        TelegramClient["Telegram Client (Interactive Bot UI)"]
        AndroidClient["Future Android App (FCM Push Receiver)"]
    end

    subgraph CloudRunApp ["Next.js Unified Application (Google Cloud Run)"]
        direction TB
        AppRouter["Next.js App Router (SSR & RSC)"]
        AuthMiddleware["Server Auth & RBAC Middleware"]
        RouteHandlers["API Route Handlers (/api/*)"]

        subgraph CoreEngines ["Unified Server Business Engines"]
            DoseEngine["Deterministic Dose State Engine"]
            NotificationEngine["Unified 3-Channel Notification Dispatcher"]
            TelegramWebhookHandler["Telegram Webhook & Action Processor"]
            AuditEngine["Immutable Activity Audit Logger"]
            AIGateway["Sanitized Gemini 1.5 Flash Gateway"]
            VoiceGateway["Gnani.ai Speech & TTS Gateway"]
        end
    end

    subgraph DataTier ["Data & Authentication Tier (Supabase)"]
        SupaAuth["Supabase Auth (JWT / Sessions)"]
        PostgresDB[("Supabase PostgreSQL (Multi-Tenant RLS)")]
        SupaRealtime["Supabase Realtime (Live Dose Synchronization)"]
    end

    subgraph ExternalServices ["External Platform Services"]
        GeminiAPI["Google Gemini 1.5 Flash API"]
        GnaniAPI["Gnani.ai API (Kannada & English Voice)"]
        TelegramAPI["Official Telegram Bot API"]
        FCMService["Firebase Cloud Messaging (FCM)"]
        ResendAPI["Resend Email API"]
        CloudScheduler["Google Cloud Scheduler (10-min Cron)"]
        SecretManager["Google Secret Manager"]
    end

    %% Client traffic
    ElderlyWeb & FamilyWeb & CaretakerWeb -->|HTTPS| AuthMiddleware
    AuthMiddleware --> RouteHandlers
    TelegramClient <-->|Webhook / Inline Button Taps| TelegramWebhookHandler
    AndroidClient -.->|FCM Token Registration| RouteHandlers

    %% Auth & Data
    AuthMiddleware <-->|Verify JWT| SupaAuth
    RouteHandlers --> CoreEngines
    CoreEngines <-->|RLS Verified Queries| PostgresDB
    PostgresDB -.->|Postgres Changes WebSocket| SupaRealtime
    SupaRealtime -.->|Instant State Sync| ElderlyWeb & FamilyWeb

    %% External Connections
    NotificationEngine -->|Push Notifications| FCMService
    NotificationEngine -->|Interactive Messages| TelegramAPI
    NotificationEngine -->|Transactional Emails| ResendAPI
    TelegramWebhookHandler -->|Update Dose Status| DoseEngine
    AIGateway -->|Sanitized Structured Summaries| GeminiAPI
    VoiceGateway -->|STT / TTS Requests| GnaniAPI
    CloudScheduler -->|Bearer Protected POST| RouteHandlers
    SecretManager -.->|Runtime Env Vars Injection| CloudRunApp
```

---

## 2. Core Architectural Principles & Identity Modeling

### 2.1 Identity Decoupling: Account vs. Healthcare Profile
- **Account Identity (`profiles`):** Represents an authenticated individual (Full Name, Email, Password, Phone Number, Preferred Language). Authenticated via Supabase Auth.
- **Healthcare Profile Identity (`healthcare_profiles`):** Represents the clinical entity (Date of Birth, Blood Group, Timezone, Allergies, Medical Conditions, Primary Doctor, Emergency Contact).
- **Decoupled Relationship:**
  - An elderly person can sign up and directly own their healthcare profile (`primary_elder_id = auth.uid()`).
  - An adult daughter (Priya) can sign up and create a healthcare profile for her father (`primary_elder_id = NULL` or linked to father's account if registered later). Priya becomes the initial `FAMILY_ADMIN`.
  - All access permissions are mapped through the `profile_access_members` join table.

```mermaid
erDiagram
    PROFILES ||--o{ PROFILE_ACCESS_MEMBERS : "holds access"
    HEALTHCARE_PROFILES ||--|{ PROFILE_ACCESS_MEMBERS : "grants access"
    HEALTHCARE_PROFILES ||--o{ PROFILE_ACCESS_INVITATIONS : "issues"
    
    PROFILES {
        uuid id PK
        text email UK
        text full_name
        text phone
        text preferred_language
    }
    HEALTHCARE_PROFILES {
        uuid id PK
        uuid primary_elder_id FK
        text display_name
        text timezone
        jsonb medical_conditions
        jsonb allergies
    }
    PROFILE_ACCESS_MEMBERS {
        uuid id PK
        uuid healthcare_profile_id FK
        uuid profile_id FK
        text role
        boolean can_manage_meds
        boolean can_confirm_doses
    }
```

---

## 3. End-to-End System Flows

### 3.1 Passcode-Based Access Flow (No Static Passcodes)

```mermaid
sequenceDiagram
    autonumber
    actor Owner as Elderly Owner or Family Admin
    actor Guest as Caretaker or Family Member
    participant API as VATSALYA Backend (/api/profile-access)
    participant DB as Supabase PostgreSQL

    Owner->>API: POST /api/profile-access/invite { healthcareProfileId, role: 'CARETAKER', canConfirmDoses: true }
    API->>API: Generate crypto-random 6-digit passcode (e.g. 849201)
    API->>API: Compute SHA-256 hash of passcode
    API->>DB: INSERT INTO profile_access_invitations (hashed_code, role, expires_at: NOW() + 48h)
    API-->>Owner: 201 Created { passcode: "849201", expiresAt }

    Note over Owner,Guest: Owner shares 6-digit code verbally or via message
    Guest->>API: POST /api/profile-access/redeem { passcode: "849201" } (Authenticated Session)
    API->>API: Compute SHA-256 hash of submitted passcode
    API->>DB: SELECT * FROM profile_access_invitations WHERE hashed_code = hash AND expires_at > NOW() AND used_at IS NULL
    alt Code Valid
        API->>DB: INSERT INTO profile_access_members (healthcare_profile_id, profile_id, role, ...)
        API->>DB: UPDATE profile_access_invitations SET used_at = NOW(), used_by = Guest.id
        API->>DB: INSERT INTO care_activities (action_type = 'MEMBER_JOINED')
        API-->>Guest: 200 OK { success: true, healthcareProfileId, assignedRole: 'CARETAKER' }
    else Expired or Invalid
        API-->>Guest: 400 Bad Request { error: "Invalid or expired passcode" }
    end
```

### 3.2 Medication Scheduling & Deterministic Dose State Flow

`TAKEN` and `OVERDUE` are **alternative execution outcomes**, not sequential states:

```mermaid
sequenceDiagram
    autonumber
    participant System as System Clock / Schedule
    participant StateEngine as Dose State Evaluator
    actor Elder as Elderly User / Caretaker
    participant API as /api/doses/confirm
    participant DB as Supabase PostgreSQL

    Note over System,StateEngine: Target time: 08:30 AM. Window: [08:00 AM - 09:00 AM]
    System->>StateEngine: Clock reaches 08:00 AM -> Dose transitions from UPCOMING to DUE
    
    alt Happy Path: User takes medication within window (e.g. 08:25 AM)
        Elder->>API: POST /api/doses/confirm { scheduleId, date: '2026-11-15' }
        API->>DB: INSERT INTO dose_logs (schedule_id, scheduled_date, status: 'TAKEN', recorded_at: NOW())
        DB-->>API: 201 Created
        API-->>Elder: 200 OK (Status = TAKEN)
        Note over StateEngine: Dose permanently resolved as TAKEN. Will NEVER become OVERDUE.
    else Unattended Path: Clock reaches 09:01 AM without confirmation
        System->>StateEngine: Window expired with no dose_log -> Status evaluated as OVERDUE
        Note over StateEngine: Escalation alerts dispatched to Telegram, Email, FCM
        opt Late Confirmation (e.g. at 09:40 AM)
            Elder->>API: POST /api/doses/confirm { scheduleId, date: '2026-11-15', notes: 'Taken late with breakfast' }
            API->>DB: INSERT INTO dose_logs (status: 'TAKEN', recorded_at: NOW(), notes: ...)
            API-->>Elder: 200 OK (Status updated to TAKEN with audit note)
        end
    end
```

### 3.3 Three-Channel Notification & Deduplication Architecture

```mermaid
sequenceDiagram
    autonumber
    participant Cron as Google Cloud Scheduler (10 min)
    participant Worker as /api/jobs/notifications
    participant DB as Supabase PostgreSQL
    participant FCM as Firebase Cloud Messaging
    participant TG as Telegram Bot API
    participant Resend as Resend Email API

    Cron->>Worker: POST /api/jobs/notifications (Authorization: Bearer CRON_SECRET)
    Worker->>DB: Fetch DUE doses, OVERDUE unconfirmed doses, and UPCOMING appointments
    
    loop For each candidate notification event
        Worker->>Worker: Generate idempotency_key = MD5(profile_id + schedule_id + date + trigger_type)
        Worker->>DB: INSERT INTO notifications (idempotency_key, status: 'PENDING') ON CONFLICT DO NOTHING
        alt Key Inserted (Not a Duplicate)
            par Dispatch Channel A: Android FCM
                Worker->>FCM: Send high-priority data message to registered device_tokens
            and Dispatch Channel B: Telegram Bot
                Worker->>TG: Send interactive message with inline keyboard [Taken | Remind | Help]
            and Dispatch Channel C: Email
                Worker->>Resend: Send transactional HTML reminder
            end
            Worker->>DB: UPDATE notifications SET status = 'SENT', dispatched_at = NOW()
        else Key Already Existed
            Worker->>Worker: Skip dispatch (Idempotency prevents duplicate alert)
        end
    end
    Worker-->>Cron: 200 OK { processed, dispatched, deduplicated }
```

### 3.4 Interactive Telegram Bot Webhook Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Elderly or Family Member
    participant Telegram as Telegram App
    participant Webhook as Next.js /api/telegram/webhook
    participant DB as Supabase PostgreSQL

    Note over User,Telegram: User receives Telegram reminder: "Metformin 500mg Due Now"
    User->>Telegram: Taps inline button [ ✅ Taken ]
    Telegram->>Webhook: POST /api/telegram/webhook (CallbackQuery: dose_log confirmation)
    Webhook->>Webhook: Validate X-Telegram-Bot-Api-Secret-Token
    Webhook->>DB: Idempotent INSERT / UPDATE in dose_logs (status = 'TAKEN')
    Webhook->>Telegram: answerCallbackQuery("Marked as taken! Good job.")
    Webhook->>Telegram: editMessageText("✅ Metformin 500mg marked as TAKEN at 08:35 AM")
```

---

## 4. Google Cloud Run Production Deployment Architecture

- **Containerization:** Multi-stage Docker build packaging the Next.js standalone server (`output: 'standalone'`).
- **Port:** Container listens on port `8080`, mapped automatically by Cloud Run.
- **Scaling Parameters:**
  - `min-instances: 1`: Retains 1 warm instance at all times to guarantee instant responses during hackathon judging.
  - `max-instances: 5`: Governs cloud cost while supporting concurrent user spikes.
- **Environment & Secrets:**
  - Injected via Google Secret Manager bindings. Zero secrets stored in source control or client JavaScript bundles.
- **Health Check Endpoint:** `/api/health` continuously monitored by Cloud Run startup and liveness probes.
