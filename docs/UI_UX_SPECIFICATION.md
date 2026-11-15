# VATSALYA (वात्सल्य) — UI/UX & Visual Design Specification

> **Brand Identity:** VATSALYA (वात्सल्य)  
> **Working Tagline:** Care beyond generations.  
> **Aesthetic Foundation:** Warm minimalism, calm dignity, and zero medical jargon. The elderly individual is empowered, respected, and kept autonomous.

---

## 1. Visual Design System & Palette

### 1.1 Color Tokens & Contrast Ratios (WCAG 2.2 AA / AAA)

| Color Token | Hex Code | Visual & Semantic Role | Contrast on Canvas |
| :--- | :--- | :--- | :--- |
| **Warm Canvas** | `#FDFBF7` | Calming background; avoids harsh white glare for older eyes. | Base Surface |
| **Pure Surface** | `#FFFFFF` | Card backgrounds with subtle warm borders (`#EFECE6`). | — |
| **Forest Green (Primary)** | `#1E3A2F` | Primary actions, branding, confirmed dose badges. | **11.4:1 (AAA)** |
| **Soft Sage (Secondary)** | `#607B6E` | Supporting labels, tab markers, non-critical highlights. | **4.9:1 (AA)** |
| **Muted Eucalyptus** | `#EBF2EE` | Background fills for active status pills. | — |
| **Deep Charcoal (Text)** | `#1F2421` | High-legibility body text. | **13.8:1 (AAA)** |
| **Subdued Slate (Muted)** | `#5C6460` | Secondary metadata (meal timing, clinic addresses). | **5.2:1 (AA)** |
| **Warm Amber (Attention)** | `#B45309` | Due doses, upcoming visits within 2 hours. | **5.8:1 (AA)** |
| **Gentle Crimson (Urgent)**| `#991B1B` | Overdue medication warnings, emergency contacts. | **7.6:1 (AAA)** |

### 1.2 Senior Ergonomics & Tactile Standards
- **Senior Font Sizing:** $32\text{ px}$ page titles, $24\text{ px}$ card headings, $18\text{ px}$ ($1.125\text{ rem}$) minimum body text on Elderly screens.
- **Minimum Touch Target:** Standard: $48 \times 48\text{ px}$; **Elderly Mode: $\ge 56 \times 56\text{ px}$** for all actionable buttons.
- **Bilingual Accessibility:** Instant language switch between English and Kannada (`ಕನ್ನಡ`) on every header.
- **Tactile & Auditory Confirmation:** Successful dose confirmation triggers native haptic vibration (`navigator.vibrate([40, 60, 40])`) and a reassuring chime sound effect.

---

## 2. Screen-by-Screen User Journeys

```mermaid
flowchart TD
    Landing["1. Landing Page"] --> Auth["2. Login / Auth (Supabase)"]
    Auth --> CheckProfile{Has Healthcare Profile?}
    
    CheckProfile -->|No| Choice{"Create Profile for Self or Elder?"}
    Choice -->|Self (Elderly)| OnboardingElderly["4. Self Onboarding"]
    Choice -->|Family on Behalf| OnboardingFamily["4. Family Onboarding"]
    Choice -->|Has Passcode| RedeemPasscode["5. Enter 6-Digit Passcode"]

    RedeemPasscode --> FamilyHome
    OnboardingElderly --> ElderlyHome["6. Elderly Home Dashboard"]
    OnboardingFamily --> FamilyHome["11. Family Collaboration Dashboard"]

    CheckProfile -->|Yes| RoleRouter{User Role?}
    RoleRouter -->|ELDERLY| ElderlyHome
    RoleRouter -->|FAMILY_ADMIN / VIEWER| FamilyHome
    RoleRouter -->|CARETAKER| CaretakerHome["12. Caretaker Shift Dashboard"]

    ElderlyHome --> DailyTimeline["8. Daily Medication Timeline"]
    ElderlyHome --> VoiceAssistant["15. Voice Assistant (Kannada/English)"]
    
    FamilyHome --> MedManager["7. Medication & Schedule Manager"]
    FamilyHome --> Appts["10. Appointment Manager"]
    FamilyHome --> NotifSettings["13. Notification Settings (Telegram/FCM/Email)"]
    FamilyHome --> AccessSettings["16. Profile Access & Permissions"]
```

---

### Screen 1: Landing Page
- **Hero:** Multi-generational warm imagery, headline *"Care beyond generations"*, subtitle *"The dignified healthcare and medication platform for seniors, trusted families, and devoted caretakers."*
- **Primary CTAs:** `"Get Started"` (opens signup) and `"Have a 6-Digit Passcode? Join Profile"` (direct entry for family/caretakers).

### Screen 2: Login and Registration
- **Fields:** Full Name, Email, Password, Phone Number, Preferred Language (`English`, `ಕನ್ನಡ`).
- **Options:** Magic Link for seniors who struggle with complex passwords.

### Screen 3 & 4: Healthcare Profile Onboarding
- **Two Distinct Pathways:**
  - *Option A:* "I am setting this up for myself" (sets user as Elderly Owner).
  - *Option B:* "I am setting this up for my parent or loved one" (sets user as Family Manager; elder can be invited or left offline).
- **Clinical Inputs:** Full Name, Date of Birth, Gender, Blood Group, Timezone, Allergies, Chronic Conditions, Primary Doctor and Hospital Details, Emergency Contact.

### Screen 5: Passcode Generation & Redemption
- **Passcode Generation:** Displays large spaced 6-digit PIN (e.g. `8  4  9  2  0  1`) with 48-hour expiration timer, assigned role, and one-tap WhatsApp share.
- **Passcode Redemption (`/join`):** Simple 6-digit numeric input with auto-advance and instant role confirmation.

### Screen 6: Elderly Home Dashboard (Dignified Senior Experience)
- **Visual Calm:** Devoid of complex charts, tabs, or menus.
- **Greeting:** Empathetic greeting (e.g. *"ನಮಸ್ಕಾರ ಅಪ್ಪಾಜಿ (Good Morning Appaji)"*), current time, and weather.
- **Hero Dose Card:** 
  - Massive card with high-contrast text: **"Telmisartan 40mg"** — **"Take 1 tablet after breakfast"**.
  - High-visibility Forest Green button ($64\text{ px}$ height): **"Mark as Taken (ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ)"**.
- **Secondary Actions:**
  - *"Next Doctor Visit:"* Dr. Ramesh, Wednesday 10:30 AM.
  - *"Need Help?"* Giant amber button calling emergency contact directly.
  - Floating microphone button launching Kannada/English voice assistant.

### Screen 7 & 8: Medication Management & Daily Timeline
- **Medication Configurator:** Add medicines with multi-slot schedules (Morning 08:30, Evening 20:30) and meal contexts (`Before Meal`, `With Meal`, `After Meal`).
- **Timeline Progression:** 
  - `08:30 AM` — Telmisartan 40mg — **Taken at 08:35 AM** (Soft green checkmark).
  - `01:30 PM` — Metformin 500mg — **Due Now** (Warm amber glowing border).
  - `08:30 PM` — Metformin 500mg — **Upcoming** (Subtle slate border).

### Screen 9 & 10: Dose Confirmation & Doctor Appointments
- **Dose Confirmation:** Instant visual transition; prevents duplicate clicks; records exact timestamp and actor role.
- **Appointments:** Chronological cards with doctor specialty, clinic address with Google Maps link, and designated family companion tag.

### Screen 11: Family Collaborative Dashboard
- **Executive Summary:** Today's adherence status (e.g. *"2 of 3 doses taken. Next dose at 8:30 PM"*).
- **Adherence Trend:** 7-day adherence bar chart.
- **AI Daily Care Brief:** 3-sentence plain language summary generated by Google Gemini.
- **Access Member Bar:** Displays avatars of family members and active caretakers with assigned permissions.

### Screen 12: Caretaker Shift Dashboard
- **Shift View:** Daily checklist of medications to administer.
- **Administration Logging:** Ability to record dose given on behalf of the senior with clinical observations.
- **Handover Memo:** Input field to leave notes for the next shift or family.

### Screen 13: Notification Settings (The 3 Channels)
- **Channel A (Android Push):** Device status, registered FCM token details, and toggle for push alerts.
- **Channel B (Telegram Bot):** One-tap button `"Connect Telegram Bot"` opening `t.me/VatsalyaCareBot?start=<TOKEN>` and QR code for scanning.
- **Channel C (Email):** Recipient email addresses and notification preference checkboxes (Upcoming doses, Overdue escalations, Appointments).

### Screen 14 & 15: AI Daily Care Brief & Voice Assistant
- **AI Brief:** Gemini-powered daily summary highlighting hydration, upcoming doctor visits, and adherence milestones.
- **Voice Assistant (Gnani.ai):** Spoken interaction in Kannada and English. Includes a strict **two-step confirmation lock** (voice queries schedule, but marking a dose taken requires physical screen tap).

### Screen 16: Profile Access & Permissions Settings
- **Role Governance:** List of all users with access to the healthcare profile.
- **One-Tap Revoke:** Elderly owner or family admin can immediately revoke any caretaker or family member's access.
