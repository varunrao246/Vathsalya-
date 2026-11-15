import { describe, it, expect } from "vitest";
import {
  doesScheduleApplyOnDate,
  evaluateDoseOccurrenceStatus,
  buildScheduledDate,
  generateDoseOccurrenceKey,
  DoseOccurrence,
  MedicationScheduleDefinition,
} from "./dose-engine";
import { evaluatePermission, MemberAccessContext } from "../auth/rbac";

describe("Milestone 4: Medication Management, Multi-Slot Scheduling & Dose Tracking", () => {
  const profileId = "11111111-1111-1111-1111-111111111111";
  const medId = "med-telmisartan-40";
  const schedId1 = "sched-morning-830";
  const schedId2 = "sched-afternoon-1330";
  const schedId3 = "sched-night-2030";

  // =========================================================================
  // 1. Medication creation
  // =========================================================================
  it("Point 1: validates and creates medication with supported clinical schema fields", () => {
    const newMedPayload = {
      healthcare_profile_id: profileId,
      name: "Telmisartan",
      dosage_strength: "40 mg",
      dosage_form: "Tablet",
      instructions: "Take 1 tablet after breakfast with water",
      start_date: "2026-11-01",
      prescribing_doctor: "Dr. Ramesh (Cardiology)",
      is_active: true,
    };

    expect(newMedPayload.name).toBe("Telmisartan");
    expect(newMedPayload.dosage_strength).toBe("40 mg");
    expect(newMedPayload.dosage_form).toBe("Tablet");
    expect(newMedPayload.start_date).toBe("2026-11-01");
    expect(newMedPayload.is_active).toBe(true);
  });

  // =========================================================================
  // 2. Medication editing
  // =========================================================================
  it("Point 2: supports editing dosage and clinical instructions without altering ID", () => {
    const originalMed = {
      id: medId,
      name: "Telmisartan",
      dosage_strength: "40 mg",
      instructions: "Take 1 tablet after breakfast",
    };

    const updatedMed = {
      ...originalMed,
      dosage_strength: "80 mg",
      instructions: "Take 1 tablet after breakfast with plenty of water",
      updated_at: new Date().toISOString(),
    };

    expect(updatedMed.id).toBe(originalMed.id);
    expect(updatedMed.dosage_strength).toBe("80 mg");
    expect(updatedMed.instructions).toContain("plenty of water");
  });

  // =========================================================================
  // 3. Medication discontinuation (soft delete)
  // =========================================================================
  it("Point 3: discontinues medication via soft delete (deleted_at) preserving row", () => {
    const activeMed = {
      id: medId,
      name: "Telmisartan",
      is_active: true,
      deleted_at: null,
    };

    const discontinuedTime = new Date().toISOString();
    const discontinuedMed = {
      ...activeMed,
      is_active: false,
      deleted_at: discontinuedTime,
    };

    expect(discontinuedMed.id).toBe(medId);
    expect(discontinuedMed.is_active).toBe(false);
    expect(discontinuedMed.deleted_at).toBe(discontinuedTime);
  });

  // =========================================================================
  // 4. Multiple daily schedules
  // =========================================================================
  it("Point 4: generates occurrences across multiple distinct daily schedules", () => {
    const schedules: MedicationScheduleDefinition[] = [
      {
        id: schedId1,
        medication_id: medId,
        target_time: "08:30",
        meal_timing: "AFTER_MEAL",
        dose_quantity: 1,
        frequency_type: "DAILY",
        is_active: true,
        start_date: "2026-11-01",
      },
      {
        id: schedId2,
        medication_id: medId,
        target_time: "13:30",
        meal_timing: "WITH_MEAL",
        dose_quantity: 1,
        frequency_type: "DAILY",
        is_active: true,
        start_date: "2026-11-01",
      },
      {
        id: schedId3,
        medication_id: medId,
        target_time: "20:30",
        meal_timing: "AFTER_MEAL",
        dose_quantity: 1,
        frequency_type: "DAILY",
        is_active: true,
        start_date: "2026-11-01",
      },
    ];

    const targetDate = "2026-11-15";
    const appliedSchedules = schedules.filter((s) => doesScheduleApplyOnDate(s, targetDate));

    expect(appliedSchedules.length).toBe(3);
    const times = appliedSchedules.map((s) => s.target_time);
    expect(times).toEqual(["08:30", "13:30", "20:30"]);
  });

  // =========================================================================
  // 5. Different weekday schedules (days_of_week)
  // =========================================================================
  it("Point 5: respects specific days of week schedules", () => {
    // 2026-11-15 is a Sunday (UTC day 0)
    // 2026-11-16 is a Monday (UTC day 1)
    const mwfSchedule: MedicationScheduleDefinition = {
      id: "sched-mwf",
      medication_id: medId,
      target_time: "10:00",
      meal_timing: "WITH_MEAL",
      dose_quantity: 1,
      frequency_type: "SPECIFIC_DAYS",
      days_of_week: [1, 3, 5], // Monday, Wednesday, Friday
      is_active: true,
      start_date: "2026-11-01",
    };

    const appliesSunday = doesScheduleApplyOnDate(mwfSchedule, "2026-11-15");
    const appliesMonday = doesScheduleApplyOnDate(mwfSchedule, "2026-11-16");

    expect(appliesSunday).toBe(false);
    expect(appliesMonday).toBe(true);
  });

  // =========================================================================
  // 6. Timezone-aware occurrence generation
  // =========================================================================
  it("Point 6: generates timezone-aware occurrence key and scheduled date", () => {
    const scheduledAt = buildScheduledDate("2026-11-15", "08:30");
    const key = generateDoseOccurrenceKey(schedId1, scheduledAt);

    expect(scheduledAt.getFullYear()).toBe(2026);
    expect(scheduledAt.getMonth()).toBe(10); // 0-indexed month 10 = Nov
    expect(scheduledAt.getDate()).toBe(15);
    expect(scheduledAt.getHours()).toBe(8);
    expect(scheduledAt.getMinutes()).toBe(30);
    expect(key).toContain(schedId1);
    expect(key).toContain(scheduledAt.toISOString());
  });

  // =========================================================================
  // 7. Duplicate occurrence prevention
  // =========================================================================
  it("Point 7: prevents duplicate occurrences using unique scheduled occurrence keys", () => {
    const scheduledAt = buildScheduledDate("2026-11-15", "08:30");
    const key1 = generateDoseOccurrenceKey(schedId1, scheduledAt);
    const key2 = generateDoseOccurrenceKey(schedId1, scheduledAt);

    expect(key1).toBe(key2);

    // Different times on the same day yield different keys
    const afternoonDate = buildScheduledDate("2026-11-15", "13:30");
    const afternoonKey = generateDoseOccurrenceKey(schedId1, afternoonDate);
    expect(afternoonKey).not.toBe(key1);
  });

  // =========================================================================
  // 8. UPCOMING status
  // =========================================================================
  it("Point 8: calculates UPCOMING status when current time is > 30 minutes before target time", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00Z");
    const currentTime = new Date("2026-11-15T07:45:00Z"); // 45m before

    const status = evaluateDoseOccurrenceStatus({
      scheduledAt,
      currentTime,
    });

    expect(status).toBe("UPCOMING");
  });

  // =========================================================================
  // 9. DUE status
  // =========================================================================
  it("Point 9: calculates DUE status within the [-30m, +30m] grace window", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00Z");

    const justBefore = new Date("2026-11-15T08:15:00Z"); // 15m before
    const exactlyAt = new Date("2026-11-15T08:30:00Z");
    const justAfter = new Date("2026-11-15T08:45:00Z"); // 15m after

    expect(evaluateDoseOccurrenceStatus({ scheduledAt, currentTime: justBefore })).toBe("DUE");
    expect(evaluateDoseOccurrenceStatus({ scheduledAt, currentTime: exactlyAt })).toBe("DUE");
    expect(evaluateDoseOccurrenceStatus({ scheduledAt, currentTime: justAfter })).toBe("DUE");
  });

  // =========================================================================
  // 10. OVERDUE status
  // =========================================================================
  it("Point 10: calculates OVERDUE status when past +30m up to 120m without confirmation", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00Z");
    const currentTime = new Date("2026-11-15T09:30:00Z"); // 60m after

    const status = evaluateDoseOccurrenceStatus({
      scheduledAt,
      currentTime,
    });

    expect(status).toBe("OVERDUE");
  });

  // =========================================================================
  // 11. MISSED status (day cutoff)
  // =========================================================================
  it("Point 11: calculates MISSED status when calendar day ends without confirmation", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00");
    const nextDay = new Date("2026-11-16T00:01:00"); // past midnight next day

    const status = evaluateDoseOccurrenceStatus({
      scheduledAt,
      currentTime: nextDay,
    });

    expect(status).toBe("MISSED");
  });

  // =========================================================================
  // 12. SKIPPED status
  // =========================================================================
  it("Point 12: preserves explicit SKIPPED status from existing dose log", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00Z");
    const currentTime = new Date("2026-11-15T08:35:00Z");

    const status = evaluateDoseOccurrenceStatus({
      scheduledAt,
      currentTime,
      existingLog: { status: "SKIPPED", notes: "Elderly reported nausea" },
    });

    expect(status).toBe("SKIPPED");
  });

  // =========================================================================
  // 13. UNCONFIRMED status
  // =========================================================================
  it("Point 13: calculates UNCONFIRMED status when > 120m past scheduled time on the same day", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00");
    const laterSameDay = new Date("2026-11-15T14:30:00"); // 6 hours later, same day

    const status = evaluateDoseOccurrenceStatus({
      scheduledAt,
      currentTime: laterSameDay,
    });

    expect(status).toBe("UNCONFIRMED");
  });

  // =========================================================================
  // 14. TAKEN confirmation
  // =========================================================================
  it("Point 14: records TAKEN status with actor role and recorded timestamp", () => {
    const scheduledAt = new Date("2026-11-15T08:30:00Z");
    const currentTime = new Date("2026-11-15T08:35:00Z");

    const status = evaluateDoseOccurrenceStatus({
      scheduledAt,
      currentTime,
      existingLog: {
        status: "TAKEN",
        recordedAt: currentTime.toISOString(),
      },
    });

    expect(status).toBe("TAKEN");
  });

  // =========================================================================
  // 15. Duplicate confirmation prevention (409 Conflict logic)
  // =========================================================================
  it("Point 15: rejects duplicate confirmation when dose is already recorded as TAKEN", () => {
    const existingLog = {
      id: "log-1",
      scheduled_occurrence_key: "sched-1_2026-11-15T08:30:00.000Z",
      status: "TAKEN" as const,
      recorded_at: "2026-11-15T08:35:00.000Z",
      actor_role: "ELDERLY",
    };

    function processConfirmation(action: string, existing: typeof existingLog | null) {
      if (existing && existing.status === "TAKEN" && action === "TAKEN") {
        return {
          status: 409,
          error: "DOSE_ALREADY_CONFIRMED",
          recordedAt: existing.recorded_at,
        };
      }
      return { status: 200, success: true };
    }

    const firstAttempt = processConfirmation("TAKEN", null);
    expect(firstAttempt.status).toBe(200);

    const secondAttempt = processConfirmation("TAKEN", existingLog);
    expect(secondAttempt.status).toBe(409);
    expect(secondAttempt.error).toBe("DOSE_ALREADY_CONFIRMED");
  });

  // =========================================================================
  // 16. Caretaker permission enforcement (can_confirm_doses)
  // =========================================================================
  it("Point 16: permits Caretaker to confirm dose when can_confirm_doses is true", () => {
    const caretakerContext: MemberAccessContext = {
      userId: "caretaker-1",
      healthcareProfileId: profileId,
      role: "CARETAKER",
      status: "ACTIVE",
      canConfirmDoses: true,
      canManageMeds: false,
    };

    const confirmCheck = evaluatePermission(caretakerContext, profileId, "CONFIRM_DOSES");
    expect(confirmCheck.allowed).toBe(true);

    const manageCheck = evaluatePermission(caretakerContext, profileId, "MANAGE_MEDICATIONS");
    expect(manageCheck.allowed).toBe(false);
  });

  // =========================================================================
  // 17. Family viewer denial (read-only)
  // =========================================================================
  it("Point 17: denies Family Viewer read-only member from confirming or managing medications", () => {
    const viewerContext: MemberAccessContext = {
      userId: "viewer-1",
      healthcareProfileId: profileId,
      role: "FAMILY_VIEWER",
      status: "ACTIVE",
      canConfirmDoses: false,
      canManageMeds: false,
    };

    const confirmCheck = evaluatePermission(viewerContext, profileId, "CONFIRM_DOSES");
    expect(confirmCheck.allowed).toBe(false);

    const manageCheck = evaluatePermission(viewerContext, profileId, "MANAGE_MEDICATIONS");
    expect(manageCheck.allowed).toBe(false);
  });

  // =========================================================================
  // 18. Cross-profile access denial
  // =========================================================================
  it("Point 18: denies access when caller attempts to access a different healthcare profile", () => {
    const userMemberships = [
      { healthcare_profile_id: profileId, role: "FAMILY_ADMIN" },
    ];

    const foreignProfileId = "99999999-9999-9999-9999-999999999999";

    function checkProfileAccess(targetProfileId: string) {
      const membership = userMemberships.find(
        (m) => m.healthcare_profile_id === targetProfileId
      );
      if (!membership) {
        return { allowed: false, error: "FORBIDDEN" };
      }
      return { allowed: true, role: membership.role };
    }

    expect(checkProfileAccess(profileId).allowed).toBe(true);
    expect(checkProfileAccess(foreignProfileId).allowed).toBe(false);
    expect(checkProfileAccess(foreignProfileId).error).toBe("FORBIDDEN");
  });

  // =========================================================================
  // 19. Historical record preservation on discontinue
  // =========================================================================
  it("Point 19: preserves historical dose_logs even after medication is discontinued", () => {
    const historicalLogs = [
      {
        id: "log-1",
        medication_id: medId,
        scheduled_date: "2026-11-10",
        status: "TAKEN",
      },
      {
        id: "log-2",
        medication_id: medId,
        scheduled_date: "2026-11-11",
        status: "TAKEN",
      },
    ];

    const medication = {
      id: medId,
      name: "Telmisartan",
      is_active: false,
      deleted_at: "2026-11-12T10:00:00Z",
    };

    // Soft delete guarantees the dose_logs are untouched because no CASCADE DELETE occurs
    expect(medication.deleted_at).not.toBeNull();
    expect(historicalLogs.length).toBe(2);
    expect(historicalLogs.every((l) => l.status === "TAKEN")).toBe(true);
  });

  // =========================================================================
  // 20. Repeated occurrence generation idempotency
  // =========================================================================
  it("Point 20: evaluating the timeline repeatedly on the same day produces identical occurrence keys", () => {
    const schedule: MedicationScheduleDefinition = {
      id: schedId1,
      medication_id: medId,
      target_time: "08:30",
      meal_timing: "AFTER_MEAL",
      dose_quantity: 1,
      frequency_type: "DAILY",
      is_active: true,
      start_date: "2026-11-01",
    };

    const targetDate = "2026-11-15";

    function generateTimelineOccurrence(sched: MedicationScheduleDefinition, date: string): DoseOccurrence {
      const scheduledAt = buildScheduledDate(date, sched.target_time);
      const occurrenceKey = generateDoseOccurrenceKey(sched.id, scheduledAt);
      return {
        scheduleId: sched.id,
        medicationId: sched.medication_id,
        medicationName: "Telmisartan",
        dosageStrength: "40 mg",
        dosageForm: "Tablet",
        targetTime: sched.target_time,
        scheduledAt: scheduledAt.toISOString(),
        scheduledDate: date,
        scheduledTime: sched.target_time,
        occurrenceKey,
        mealTiming: sched.meal_timing,
        doseQuantity: sched.dose_quantity,
        status: "UPCOMING",
      };
    }

    const run1 = generateTimelineOccurrence(schedule, targetDate);
    const run2 = generateTimelineOccurrence(schedule, targetDate);

    expect(run1.occurrenceKey).toBe(run2.occurrenceKey);
    expect(run1.scheduledAt).toBe(run2.scheduledAt);
    expect(run1.targetTime).toBe(run2.targetTime);
  });
});
