import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export type VoiceIntent = "TAKEN" | "NOT_TAKEN" | "SNOOZE" | "HELP" | "UNKNOWN";

interface VoiceIntentResult {
  intent: VoiceIntent;
  spokenResponseKannada: string;
  spokenResponseEnglish: string;
  requiresVisualTap: boolean;
  notes?: string;
}

/**
 * Deterministic intent classifier for elderly voice medication responses in Kannada & English.
 */
export function classifyVoiceIntent(transcript: string): VoiceIntent {
  const text = transcript.toLowerCase().trim();

  // 1. HELP / Emergency
  if (
    text.includes("help") ||
    text.includes("pain") ||
    text.includes("dizzy") ||
    text.includes("doctor") ||
    text.includes("son") ||
    text.includes("daughter") ||
    text.includes("ಸಹಾಯ") ||
    text.includes("ನೋವು") ||
    text.includes("ತಲೆಸುತ್ತು") ||
    text.includes("ಕಷ್ಟ") ||
    text.includes("ತುರ್ತು")
  ) {
    return "HELP";
  }

  // 2. SNOOZE / Remind Later
  if (
    text.includes("later") ||
    text.includes("snooze") ||
    text.includes("after") ||
    text.includes("15 min") ||
    text.includes("minute") ||
    text.includes("delay") ||
    text.includes("wait") ||
    text.includes("ನಂತರ") ||
    text.includes("ಆಮೇಲೆ") ||
    text.includes("ಸ್ವಲ್ಪ ಹೊತ್ತು") ||
    text.includes("ತಾಳಿ")
  ) {
    return "SNOOZE";
  }

  // 3. TAKEN / Affirmative (Check before negative to avoid false overlap)
  // Ensure "not taken" or "haven't" is NOT in the phrase
  const isNegative =
    text.includes("no") ||
    text.includes("not") ||
    text.includes("haven't") ||
    text.includes("did not") ||
    text.includes("don't") ||
    text.includes("ಇಲ್ಲ") ||
    text.includes("ತೆಗೆದುಕೊಂಡಿಲ್ಲ") ||
    text.includes("ಹಾಕಿಲ್ಲ") ||
    text.includes("ಇನ್ನು ಇಲ್ಲ");

  if (!isNegative) {
    if (
      text.includes("yes") ||
      text.includes("taken") ||
      text.includes("took") ||
      text.includes("done") ||
      text.includes("already") ||
      text.includes("swallowed") ||
      text.includes("finished") ||
      text.includes("ಹೌದು") ||
      text.includes("ತೆಗೆದುಕೊಂಡೆ") ||
      text.includes("ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ") ||
      text.includes("ಆಯಿತು") ||
      text.includes("ಆಗಿದೆ") ||
      text.includes("ಕುಡಿದಿದ್ದೇನೆ") ||
      text.includes("ತಿಂದೆ")
    ) {
      return "TAKEN";
    }
  }

  // 4. NOT TAKEN / Negative
  if (isNegative) {
    return "NOT_TAKEN";
  }

  return "UNKNOWN";
}

/**
 * POST /api/voice/process
 * Evaluates spoken responses from the elderly voice assistant, logs verbal reports,
 * and coordinates care escalation without automatically confirming dose intake.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      transcript = "",
      language = "kn", // "kn" | "en"
      healthcareProfileId,
      occurrenceKey,
      medicationName = "Medication",
    } = body;

    const intent = classifyVoiceIntent(transcript);
    const supabase = createAdminClient();

    let result: VoiceIntentResult;

    switch (intent) {
      case "TAKEN":
        result = {
          intent: "TAKEN",
          spokenResponseKannada:
            "ಉತ್ತಮ! ಧ್ವನಿ ಮೂಲಕ ಮಾತ್ರ ಮಾತ್ರೆ ದಾಖಲಾಗುವುದಿಲ್ಲ. ದೃಢೀಕರಿಸಲು ದಯವಿಟ್ಟು ಪರದೆಯ ಮೇಲಿನ ದೊಡ್ಡ ಹಸಿರು ಬಟನ್ ಒತ್ತಿರಿ.",
          spokenResponseEnglish:
            "Great! For clinical safety, voice alone cannot mark medication as taken. Please tap the large green button on your screen to complete confirmation.",
          requiresVisualTap: true,
          notes: "Elderly user verbally reported taking the tablet. Explicit visual on-screen confirmation requested.",
        };

        // Record verbal report in care_activities (separate from confirmed dose_logs)
        if (healthcareProfileId) {
          await supabase.from("care_activities").insert({
            healthcare_profile_id: healthcareProfileId,
            actor_role: "ELDERLY",
            action_type: "UNVERIFIED_VERBAL_REPORT",
            action_payload: {
              medicationName,
              occurrenceKey,
              transcript,
              reportedStatus: "TAKEN",
              requiresVisualVerification: true,
              timestamp: new Date().toISOString(),
            },
          });
        }
        break;

      case "NOT_TAKEN":
        result = {
          intent: "NOT_TAKEN",
          spokenResponseKannada:
            "ಪರವಾಗಿಲ್ಲ. ದಯವಿಟ್ಟು ನೀರನ್ನು ತೆಗೆದುಕೊಂಡು ನಿಮ್ಮ ನಿಗದಿತ ಮಾತ್ರೆ ಸೇವಿಸಿ. ಹೆಚ್ಚುವರಿ ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳಬೇಡಿ.",
          spokenResponseEnglish:
            "No problem. Please take your prescribed tablet with water when you are ready. Please do not take an extra dose.",
          requiresVisualTap: false,
          notes: "User verbally stated they have not taken the medication yet.",
        };
        break;

      case "SNOOZE":
        result = {
          intent: "SNOOZE",
          spokenResponseKannada:
            "ಸರಿ, 15 ನಿಮಿಷಗಳ ನಂತರ ಮತ್ತೊಮ್ಮೆ ನೆನಪಿಸುತ್ತೇನೆ. ದಯವಿಟ್ಟು ವಿಶ್ರಾಂತಿ ಪಡೆಯಿರಿ.",
          spokenResponseEnglish:
            "Understood. I will remind you again in 15 minutes. Please rest.",
          requiresVisualTap: false,
          notes: "User requested a 15-minute reminder delay.",
        };
        break;

      case "HELP":
        result = {
          intent: "HELP",
          spokenResponseKannada:
            "ಗಮನಿಸಿದೆ. ನಿಮ್ಮ ಕುಟುಂಬ ಮತ್ತು ಆರೈಕೆ ತಂಡಕ್ಕೆ ತಕ್ಷಣವೇ ಸಹಾಯದ ಸಂದೇಶ ಕಳುಹಿಸಲಾಗುತ್ತಿದೆ.",
          spokenResponseEnglish:
            "Understood. I am notifying your family and care team right away that you need assistance.",
          requiresVisualTap: false,
          notes: "User requested assistance via voice.",
        };

        // Trigger immediate escalation event and care activity
        if (healthcareProfileId && occurrenceKey) {
          await supabase.from("escalation_events").upsert(
            {
              healthcare_profile_id: healthcareProfileId,
              schedule_occurrence_key: occurrenceKey,
              medication_name: medicationName,
              target_time: "Voice Trigger",
              scheduled_at: new Date().toISOString(),
              escalation_level: "URGENT",
              status: "PENDING",
              reason: `Assistance requested via spoken voice assistant: "${transcript}"`,
            },
            { onConflict: "schedule_occurrence_key,escalation_level" }
          );

          await supabase.from("care_activities").insert({
            healthcare_profile_id: healthcareProfileId,
            actor_role: "ELDERLY",
            action_type: "ALERT_ESCALATION",
            action_payload: {
              source: "VOICE_ASSISTANT",
              transcript,
              medicationName,
            },
          });
        }
        break;

      case "UNKNOWN":
      default:
        result = {
          intent: "UNKNOWN",
          spokenResponseKannada:
            "ಕ್ಷಮಿಸಿ, ಸರಿಯಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ನೀವು ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ? ಹೌದು ಅಥವಾ ಇಲ್ಲ ಎಂದು ಹೇಳಿ.",
          spokenResponseEnglish:
            "I didn't quite catch that. Have you taken your tablet? Please say yes or no.",
          requiresVisualTap: false,
        };
        break;
    }

    const spokenText =
      language === "kn" ? result.spokenResponseKannada : result.spokenResponseEnglish;

    return NextResponse.json({
      success: true,
      data: {
        intent: result.intent,
        spokenText,
        requiresVisualTap: result.requiresVisualTap,
        notes: result.notes,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: "VOICE_PROCESSING_ERROR",
          message: err instanceof Error ? err.message : "Failed to process voice command.",
        },
      },
      { status: 500 }
    );
  }
}
