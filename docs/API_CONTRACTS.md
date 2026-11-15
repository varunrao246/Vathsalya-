# VATSALYA (वात्सल्य) — API Contracts & Route Specifications

> **Protocol:** HTTPS REST over Next.js Route Handlers (`app/api/*`)  
> **Payload Format:** JSON (`application/json`)  
> **Terminology Standard:** Clean healthcare profile and profile access paths. Zero obsolete terminology.

---

## 1. Standard Response Envelope & Error Codes

### 1.1 Success Response Schema
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "timestamp": "2026-11-15T09:30:00.000Z",
    "requestId": "req_01HJ8Z8V9..."
  }
}
```

### 1.2 Error Response Schema
```json
{
  "success": false,
  "error": {
    "code": "DOSE_ALREADY_CONFIRMED",
    "message": "This medication dose has already been confirmed as taken at 08:35 AM by Appaji.",
    "details": {
      "scheduleId": "550e8400-e29b-41d4-a716-446655440000",
      "recordedAt": "2026-11-15T08:35:12.000Z",
      "actorRole": "ELDERLY"
    }
  }
}
```

---

## 2. Authentication & User Profile Routes

### 2.1 `POST /api/auth/profile`
- **Purpose:** Complete user account registration after Supabase signup.
- **Request Body:**
```json
{
  "fullName": "Priya Sharma",
  "phone": "+919876543210",
  "preferredLanguage": "en"
}
```
- **Response (200 OK):** Returns updated account record in `profiles`.

---

## 3. Healthcare Profile & Passcode Access Routes

### 3.1 `POST /api/healthcare-profiles`
- **Purpose:** Create an elderly individual's clinical healthcare profile.
- **Request Body:**
```json
{
  "displayName": "Appaji",
  "dateOfBirth": "1952-04-12",
  "gender": "MALE",
  "bloodGroup": "O+",
  "timezone": "Asia/Kolkata",
  "emergencyContactName": "Priya Sharma",
  "emergencyContactPhone": "+919876543210",
  "medicalConditions": ["Hypertension", "Type 2 Diabetes"],
  "allergies": ["Penicillin"],
  "doctorName": "Dr. Ramesh",
  "hospitalName": "Manipal Hospital",
  "doctorPhone": "+919812345678"
}
```
- **Response (201 Created):** Returns created `healthcare_profiles` record. Automatically binds the creator in `profile_access_members` as `ELDERLY` (if creating for self) or `FAMILY_ADMIN`.

### 3.2 `POST /api/profile-access/invite`
- **Purpose:** Generate a secure, time-limited 6-digit passcode for family or caretaker access.
- **Auth:** Profile Owner (`ELDERLY`) or `FAMILY_ADMIN`.
- **Request Body:**
```json
{
  "healthcareProfileId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "role": "CARETAKER",
  "canManageMeds": false,
  "canConfirmDoses": true
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "invitationId": "4a737be7-8f55-46b5-9005-950c4bb639eb",
    "passcode": "849201",
    "expiresAt": "2026-11-17T09:30:00.000Z",
    "instructions": "Share this 6-digit passcode with your caretaker. It will expire in 48 hours."
  }
}
```

### 3.3 `POST /api/profile-access/redeem`
- **Purpose:** Redeem a 6-digit passcode to join an elderly person's healthcare profile.
- **Auth:** Authenticated user session.
- **Request Body:**
```json
{
  "passcode": "849201"
}
```
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "healthcareProfileId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
    "elderlyName": "Appaji",
    "assignedRole": "CARETAKER",
    "joinedAt": "2026-11-15T09:35:00.000Z"
  }
}
```

---

## 4. Medication & Schedule Management Routes

### 4.1 `GET /api/medications?healthcareProfileId={id}`
- **Purpose:** Fetch active medications and their daily schedules.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "e8a1f736-...",
      "name": "Telmisartan",
      "dosageStrength": "40 mg",
      "dosageForm": "TABLET",
      "instructions": "Take after breakfast with water",
      "prescribingDoctor": "Dr. Ramesh",
      "startDate": "2026-01-01",
      "endDate": null,
      "schedules": [
        {
          "id": "f1b2c3d4-...",
          "targetTime": "08:30:00",
          "mealTiming": "AFTER_MEAL",
          "doseQuantity": 1.0,
          "frequencyType": "DAILY",
          "daysOfWeek": [0, 1, 2, 3, 4, 5, 6],
          "reminderMinutesBefore": 15
        }
      ]
    }
  ]
}
```

### 4.2 `POST /api/medications`
- **Purpose:** Add a new medication and its schedule rules.
- **Request Body:**
```json
{
  "healthcareProfileId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "name": "Metformin",
  "genericName": "Metformin Hydrochloride",
  "dosageStrength": "500 mg",
  "dosageForm": "TABLET",
  "instructions": "Take with meals",
  "prescribingDoctor": "Dr. Ramesh",
  "startDate": "2026-11-01",
  "schedules": [
    {
      "targetTime": "13:30:00",
      "mealTiming": "WITH_MEAL",
      "doseQuantity": 1.0,
      "frequencyType": "DAILY",
      "reminderMinutesBefore": 15
    },
    {
      "targetTime": "20:30:00",
      "mealTiming": "WITH_MEAL",
      "doseQuantity": 1.0,
      "frequencyType": "DAILY",
      "reminderMinutesBefore": 15
    }
  ]
}
```

---

## 5. Daily Medication Timeline & Dose Confirmation Routes

### 5.1 `GET /api/doses/today?healthcareProfileId={id}&date=2026-11-15`
- **Purpose:** Retrieve evaluated daily timeline. Distinguishes alternative outcomes (`TAKEN`, `OVERDUE`).
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "date": "2026-11-15",
    "timezone": "Asia/Kolkata",
    "timeline": [
      {
        "scheduleId": "f1b2c3d4-...",
        "medicationName": "Telmisartan",
        "dosageStrength": "40 mg",
        "targetTime": "08:30:00",
        "mealTiming": "AFTER_MEAL",
        "status": "TAKEN",
        "doseLog": {
          "id": "71a9e8d2-...",
          "recordedAt": "2026-11-15T08:35:12.000Z",
          "actorRole": "ELDERLY",
          "notes": null
        }
      },
      {
        "scheduleId": "a9b8c7d6-...",
        "medicationName": "Metformin",
        "dosageStrength": "500 mg",
        "targetTime": "13:30:00",
        "mealTiming": "WITH_MEAL",
        "status": "DUE",
        "doseLog": null
      }
    ]
  }
}
```

### 5.2 `POST /api/doses/confirm`
- **Purpose:** Idempotent dose confirmation (prevents duplicate records).
- **Request Body:**
```json
{
  "healthcareProfileId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "scheduleId": "a9b8c7d6-4444-4bad-9bdd-2b0d7b3dcb6d",
  "scheduledDate": "2026-11-15",
  "scheduledTime": "13:30:00",
  "status": "TAKEN",
  "notes": "Taken on time with lunch"
}
```
- **Response (200 OK):** Confirmed dose details.
- **Response (409 Conflict):** Returned if already confirmed, including original audit details.

---

## 6. Three Notification Delivery Channel Routes

### 6.1 Channel A: Android FCM Device Management
- **`POST /api/notifications/devices`:** Register an Android device FCM token.
```json
{
  "fcmToken": "eAbc123...",
  "deviceType": "ANDROID",
  "deviceName": "Samsung Galaxy A54"
}
```
- **`DELETE /api/notifications/devices`:** Revoke an active FCM token.

### 6.2 Channel B: Interactive Telegram Bot
- **`POST /api/telegram/link-token`:** Generate a one-time link token for Telegram deep linking (`https://t.me/VatsalyaCareBot?start={TOKEN}`).
- **`POST /api/telegram/webhook`:** Webhook handler receiving updates from Telegram.
  - Validates `X-Telegram-Bot-Api-Secret-Token`.
  - Handles `/start <token>` account linking.
  - Handles inline keyboard callbacks:
    - `dose_taken:{scheduleId}:{date}` $\to$ Calls dose confirmation engine and edits Telegram message with green checkmark.
    - `dose_snooze:{scheduleId}:{date}` $\to$ Logs 15-minute snooze.
    - `dose_help:{healthcareProfileId}` $\to$ Triggers emergency contact alert.

### 6.3 Shared Engine: `POST /api/jobs/notifications`
- **Purpose:** Triggered by Google Cloud Scheduler every 10 minutes.
- **Auth:** `Authorization: Bearer ${CRON_SECRET}`.
- **Action:** Evaluates pending reminders across all 3 channels using idempotent keys.
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "evaluated": 12,
    "fcmDispatched": 3,
    "telegramDispatched": 4,
    "emailDispatched": 2,
    "deduplicatedSkipped": 3
  }
}
```
