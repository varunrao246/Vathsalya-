export type DoseStatus =
  | "UPCOMING"
  | "DUE"
  | "TAKEN"
  | "OVERDUE"
  | "MISSED"
  | "SKIPPED"
  | "UNCONFIRMED";

export interface EvaluateDoseStateParams {
  targetTimeStr: string; // e.g. "08:30:00"
  targetDateStr: string; // e.g. "2026-11-15"
  currentTime: Date;
  existingStatus?: DoseStatus | null;
  windowMinutesBefore?: number;
  windowMinutesAfter?: number;
}

/**
 * Generates an occurrence key for a dose.
 * Critical Fix: Replaces UNIQUE(schedule_id, scheduled_date) to allow multiple doses per day.
 */
export function generateDoseOccurrenceKey(scheduleId: string, scheduledAt: Date): string {
  return `${scheduleId}_${scheduledAt.toISOString()}`;
}

/**
 * Deterministic dose state evaluator.
 * Alternative execution outcomes: TAKEN and OVERDUE are distinct branches from DUE.
 */
export function evaluateDoseState({
  targetTimeStr,
  targetDateStr,
  currentTime,
  existingStatus,
  windowMinutesBefore = 30,
  windowMinutesAfter = 30,
}: EvaluateDoseStateParams): DoseStatus {
  // If an explicit status is already recorded in the database, return it
  if (existingStatus === "TAKEN") return "TAKEN";
  if (existingStatus === "SKIPPED") return "SKIPPED";
  if (existingStatus === "MISSED") return "MISSED";

  const [hours, minutes] = targetTimeStr.split(":").map(Number);
  const [year, month, day] = targetDateStr.split("-").map(Number);

  // Construct target Date object (local timezone)
  const scheduledTime = new Date(year, month - 1, day, hours, minutes, 0);

  const diffMs = currentTime.getTime() - scheduledTime.getTime();
  const diffMinutes = diffMs / (1000 * 60);

  // Before the due window starts
  if (diffMinutes < -windowMinutesBefore) {
    return "UPCOMING";
  }

  // Within the valid due window [-30m, +30m]
  if (diffMinutes >= -windowMinutesBefore && diffMinutes <= windowMinutesAfter) {
    return "DUE";
  }

  // Past the window, but within 2 hours
  if (diffMinutes > windowMinutesAfter && diffMinutes <= 120) {
    return "OVERDUE";
  }

  // More than 2 hours overdue without action
  return "UNCONFIRMED";
}
