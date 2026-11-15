export type DeliveryChannel = "TELEGRAM" | "EMAIL" | "ANDROID_FCM";

export type NotificationType =
  | "UPCOMING_DOSE"
  | "OVERDUE_DOSE"
  | "MISSED_DOSE"
  | "UPCOMING_APPOINTMENT"
  | "ESCALATION_ALERT";

export type NotificationStatus =
  | "PENDING"
  | "PROCESSING"
  | "SENT"
  | "FAILED"
  | "SKIPPED";

export type EscalationLevel = "CARETAKER_OVERDUE" | "FAMILY_ADMIN_ALERT";

export type EscalationStatus = "PENDING" | "IN_PROGRESS" | "RESOLVED" | "DISMISSED";

export type EscalationResolutionAction =
  | "CALL_COMPLETED"
  | "DOSE_CONFIRMED_BY_ELDER"
  | "ADMINISTERED_BY_CARETAKER"
  | "ELDER_REPORTS_ALREADY_TAKEN"
  | "ASSISTANCE_REQUIRED"
  | "UNABLE_TO_REACH"
  | "FOLLOW_UP_PENDING";

export interface NotificationPreference {
  healthcareProfileId: string;
  profileId: string;
  telegramEnabled: boolean;
  emailEnabled: boolean;
  reminderMinutesBefore: number;
  overdueCaretakerGraceMinutes: number;
  familyEscalationGraceMinutes: number;
}

export interface EscalationEvent {
  id: string;
  healthcareProfileId: string;
  scheduleOccurrenceKey: string;
  medicationName: string;
  targetTime: string;
  scheduledAt: string;
  escalationLevel: EscalationLevel;
  status: EscalationStatus;
  assignedCaretakerId?: string | null;
  resolutionAction?: EscalationResolutionAction | null;
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DispatchResult {
  success: boolean;
  channel: DeliveryChannel;
  providerMessageId?: string;
  error?: string;
}

export interface NotificationRecord {
  id?: string;
  idempotencyKey: string;
  healthcareProfileId: string;
  recipientIdentifier: string;
  deliveryChannel: DeliveryChannel;
  notificationType: NotificationType;
  title: string;
  message: string;
  status: NotificationStatus;
  providerMessageId?: string | null;
  errorMessage?: string | null;
  retryCount?: number;
  payload?: Record<string, unknown>;
}
