export type DoseStatus =
  | "UPCOMING"
  | "DUE"
  | "TAKEN"
  | "OVERDUE"
  | "MISSED"
  | "SKIPPED"
  | "UNCONFIRMED";

export type MealTiming =
  | "BEFORE_MEAL"
  | "WITH_MEAL"
  | "AFTER_MEAL"
  | "EMPTY_STOMACH"
  | "NO_RESTRICTION";

export type FrequencyType = "DAILY" | "SPECIFIC_DAYS" | "AS_NEEDED";

export interface MedicationScheduleDefinition {
  id: string;
  medication_id: string;
  target_time: string; // "HH:MM:SS" or "HH:MM"
  meal_timing: MealTiming;
  dose_quantity: number;
  frequency_type: FrequencyType;
  days_of_week?: number[]; // [0,1,2,3,4,5,6] (0 = Sunday)
  reminder_minutes_before?: number;
  is_active: boolean;
  start_date?: string; // "YYYY-MM-DD"
  end_date?: string | null;
}

export interface DoseOccurrence {
  scheduleId: string;
  medicationId: string;
  medicationName: string;
  dosageStrength: string;
  dosageForm: string;
  instructions?: string | null;
  targetTime: string;
  scheduledAt: string; // ISO string with timezone offset
  scheduledDate: string; // "YYYY-MM-DD"
  scheduledTime: string; // "HH:MM:SS"
  occurrenceKey: string;
  mealTiming: MealTiming;
  doseQuantity: number;
  status: DoseStatus;
  doseLogId?: string;
  recordedAt?: string;
  actorId?: string;
  actorRole?: string;
  notes?: string | null;
}

/**
 * Generates an idempotent, timezone-aware occurrence key.
 * Critical Fix: Uniquely identifies a single scheduled time occurrence of a schedule.
 */
export function generateDoseOccurrenceKey(scheduleId: string, scheduledAt: Date): string {
  return `${scheduleId}_${scheduledAt.toISOString()}`;
}

/**
 * Checks whether a medication schedule is active and applies to a given target date.
 */
export function doesScheduleApplyOnDate(
  schedule: MedicationScheduleDefinition,
  targetDateStr: string // "YYYY-MM-DD"
): boolean {
  if (!schedule.is_active) {
    return false;
  }

  const [year, month, day] = targetDateStr.split("-").map(Number);
  const targetDate = new Date(Date.UTC(year, month - 1, day));

  // Check start date
  if (schedule.start_date) {
    const [sYear, sMonth, sDay] = schedule.start_date.split("-").map(Number);
    const startDate = new Date(Date.UTC(sYear, sMonth - 1, sDay));
    if (targetDate < startDate) {
      return false;
    }
  }

  // Check end date
  if (schedule.end_date) {
    const [eYear, eMonth, eDay] = schedule.end_date.split("-").map(Number);
    const endDate = new Date(Date.UTC(eYear, eMonth - 1, eDay, 23, 59, 59));
    if (targetDate > endDate) {
      return false;
    }
  }

  // Check frequency & days of week
  if (schedule.frequency_type === "SPECIFIC_DAYS" && schedule.days_of_week) {
    const dayOfWeek = targetDate.getUTCDay(); // 0 = Sunday .. 6 = Saturday
    if (!schedule.days_of_week.includes(dayOfWeek)) {
      return false;
    }
  }

  return true;
}

export interface EvaluateDoseStateOptions {
  scheduledAt: Date;
  currentTime: Date;
  existingLog?: {
    status: DoseStatus;
    recordedAt?: string;
    notes?: string | null;
  } | null;
  gracePeriodMinutesBefore?: number;
  gracePeriodMinutesAfter?: number;
  unconfirmedThresholdMinutes?: number;
  endOfDayCutoffHours?: number; // hour in day (e.g. 24) when unconfirmed becomes missed
}

/**
 * Deterministic dose state evaluator.
 * Rules:
 * - UPCOMING: current time < scheduledAt - 30m
 * - DUE: scheduledAt - 30m <= current time <= scheduledAt + 30m
 * - OVERDUE: scheduledAt + 30m < current time <= scheduledAt + 120m
 * - UNCONFIRMED: current time > scheduledAt + 120m without confirmation
 * - MISSED: assigned when calendar day has ended without confirmation
 * - TAKEN: explicit recorded confirmation
 * - SKIPPED: explicit recorded skip action
 * - TAKEN and OVERDUE are alternative execution paths!
 */
export function evaluateDoseOccurrenceStatus({
  scheduledAt,
  currentTime,
  existingLog,
  gracePeriodMinutesBefore = 30,
  gracePeriodMinutesAfter = 30,
  unconfirmedThresholdMinutes = 120,
}: EvaluateDoseStateOptions): DoseStatus {
  // If an explicit action is already recorded in dose_logs, honor it
  if (existingLog?.status === "TAKEN") return "TAKEN";
  if (existingLog?.status === "SKIPPED") return "SKIPPED";
  if (existingLog?.status === "MISSED") return "MISSED";

  const diffMs = currentTime.getTime() - scheduledAt.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // 1. Scheduled time has not yet arrived (prior to due window)
  if (diffMinutes < -gracePeriodMinutesBefore) {
    return "UPCOMING";
  }

  // 2. Currently within due grace window [-30m, +30m]
  if (diffMinutes >= -gracePeriodMinutesBefore && diffMinutes <= gracePeriodMinutesAfter) {
    return "DUE";
  }

  // 3. Grace period expired without confirmation (OVERDUE window: 30m to 120m)
  if (diffMinutes > gracePeriodMinutesAfter && diffMinutes <= unconfirmedThresholdMinutes) {
    return "OVERDUE";
  }

  // 4. Check if calendar day ended (past midnight of scheduled date) -> MISSED
  const scheduledDateOnly = new Date(
    scheduledAt.getFullYear(),
    scheduledAt.getMonth(),
    scheduledAt.getDate()
  );
  const currentDateOnly = new Date(
    currentTime.getFullYear(),
    currentTime.getMonth(),
    currentTime.getDate()
  );

  if (currentDateOnly.getTime() > scheduledDateOnly.getTime()) {
    return "MISSED";
  }

  // 5. Past 2 hours overdue, but same day -> UNCONFIRMED
  return "UNCONFIRMED";
}

/**
 * Builds an exact Date object for a scheduled time on a target date.
 * Formats time string e.g. "08:30" or "08:30:00" on "2026-11-15".
 */
export function buildScheduledDate(targetDateStr: string, targetTimeStr: string): Date {
  const [year, month, day] = targetDateStr.split("-").map(Number);
  const timeParts = targetTimeStr.split(":").map(Number);
  const hours = timeParts[0] || 0;
  const minutes = timeParts[1] || 0;
  const seconds = timeParts[2] || 0;

  return new Date(year, month - 1, day, hours, minutes, seconds);
}
