import { DispatchResult } from "./types";

export interface ResendConfig {
  apiKey?: string;
  fromEmail?: string;
}

export function getResendConfig(): ResendConfig {
  return {
    apiKey: process.env.RESEND_API_KEY,
    fromEmail: process.env.RESEND_FROM_EMAIL || "reminders@vatsalya.care",
  };
}

export function isResendConfigured(): boolean {
  const { apiKey } = getResendConfig();
  return Boolean(
    apiKey &&
      !apiKey.includes("placeholder") &&
      !apiKey.startsWith("re_123456789")
  );
}

export interface EmailPayload {
  to: string;
  subject: string;
  elderlyName: string;
  medicationName: string;
  scheduledTime: string;
  instructions?: string;
  escalationLevel?: string;
  actionRequired?: string;
}

/**
 * Builds accessible, high-contrast HTML template adhering to VATSALYA design system.
 */
export function buildEmailTemplate({
  elderlyName,
  medicationName,
  scheduledTime,
  instructions,
  escalationLevel,
  actionRequired,
}: Omit<EmailPayload, "to" | "subject">): string {
  const isEscalation = Boolean(escalationLevel);

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>VATSALYA Care Update</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FDFBF7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1F2421;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDFBF7; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="580px" cellpadding="0" cellspacing="0" style="max-width: 580px; background-color: #ffffff; border-radius: 20px; border: 1px solid #EFECE6; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
          <!-- Header -->
          <tr>
            <td style="background-color: #1E3A2F; padding: 24px 32px;">
              <span style="font-size: 20px; font-weight: 800; color: #FFFFFF; letter-spacing: -0.5px;">VATSALYA</span>
              <span style="font-size: 13px; color: #D5E2D9; display: block; margin-top: 4px;">वात्सल्य • Care beyond generations</span>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 32px;">
              <div style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; ${
                isEscalation
                  ? "background-color: #FEF3C7; color: #92400E; border: 1px solid #FCD34D;"
                  : "background-color: #EBF2EE; color: #1E3A2F; border: 1px solid #D5E2D9;"
              }">
                ${isEscalation ? "Care Escalation Follow-Up" : "Scheduled Medication Reminder"}
              </div>

              <h1 style="font-size: 22px; font-weight: 800; color: #1E3A2F; margin: 16px 0 8px 0; line-height: 1.3;">
                ${
                  isEscalation
                    ? `Care Follow-Up for ${elderlyName}`
                    : `Medication Reminder for ${elderlyName}`
                }
              </h1>

              <p style="font-size: 15px; color: #5C6460; margin: 0 0 24px 0; line-height: 1.5;">
                ${
                  isEscalation
                    ? `Confirmation is currently pending for ${elderlyName}'s scheduled medication. Please review and coordinate follow-up.`
                    : `This is a scheduled reminder for ${elderlyName}'s upcoming medication.`
                }
              </p>

              <!-- Schedule Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FDFBF7; border: 1px solid #EFECE6; border-radius: 14px; padding: 16px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #607B6E; font-weight: 600;">Medication:</td>
                  <td style="padding: 6px 0; font-size: 15px; color: #1E3A2F; font-weight: 800; text-align: right;">${medicationName}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #607B6E; font-weight: 600;">Scheduled Target Time:</td>
                  <td style="padding: 6px 0; font-size: 15px; color: #1E3A2F; font-weight: 800; text-align: right;">${scheduledTime}</td>
                </tr>
                ${
                  instructions
                    ? `<tr>
                        <td style="padding: 6px 0; font-size: 13px; color: #607B6E; font-weight: 600;">Instructions:</td>
                        <td style="padding: 6px 0; font-size: 13px; color: #1E3A2F; font-weight: 600; text-align: right;">${instructions}</td>
                       </tr>`
                    : ""
                }
                <tr>
                  <td style="padding: 6px 0; font-size: 13px; color: #607B6E; font-weight: 600;">Status:</td>
                  <td style="padding: 6px 0; font-size: 13px; color: ${
                    isEscalation ? "#B45309" : "#1E3A2F"
                  }; font-weight: 800; text-align: right;">
                    ${isEscalation ? "Medication confirmation is pending" : "Upcoming Scheduled Dose"}
                  </td>
                </tr>
              </table>

              ${
                actionRequired
                  ? `<div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;">
                      <p style="margin: 0; font-size: 13px; color: #92400E; font-weight: 600; line-height: 1.4;">
                        <strong>Action Required:</strong> ${actionRequired}
                      </p>
                     </div>`
                  : ""
              }

              <p style="font-size: 12px; color: #5C6460; line-height: 1.5; margin: 0; padding-top: 16px; border-top: 1px solid #EFECE6;">
                <strong>Clinical Guardrail:</strong> VATSALYA alerts coordinate care follow-up. Never take an additional dose or modify prescribed amounts without consulting the prescribing physician.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #FAF8F5; padding: 16px 32px; border-top: 1px solid #EFECE6; text-align: center;">
              <p style="font-size: 11px; color: #5C6460; margin: 0;">
                Sent securely by VATSALYA Collaborative Healthcare Platform.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Sends transactional email via Resend API.
 */
export async function sendEmail(payload: EmailPayload): Promise<DispatchResult> {
  const { apiKey, fromEmail } = getResendConfig();

  if (!isResendConfigured() || !apiKey) {
    return {
      success: false,
      channel: "EMAIL",
      error: "RESEND_NOT_CONFIGURED: Live Resend API key is not configured in environment.",
    };
  }

  try {
    const html = buildEmailTemplate({
      elderlyName: payload.elderlyName,
      medicationName: payload.medicationName,
      scheduledTime: payload.scheduledTime,
      instructions: payload.instructions,
      escalationLevel: payload.escalationLevel,
      actionRequired: payload.actionRequired,
    });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [payload.to],
        subject: payload.subject,
        html,
      }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      return {
        success: false,
        channel: "EMAIL",
        error: data.error?.message || `HTTP_${res.status}: Failed to send email via Resend.`,
      };
    }

    return {
      success: true,
      channel: "EMAIL",
      providerMessageId: String(data.id || ""),
    };
  } catch (err: unknown) {
    return {
      success: false,
      channel: "EMAIL",
      error: err instanceof Error ? err.message : "NETWORK_ERROR",
    };
  }
}
