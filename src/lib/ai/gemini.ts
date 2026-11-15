/**
 * VATSALYA — Generative AI Clinical Care Summaries (Google Gemini)
 *
 * Grounded, safety-checked AI summaries for family members and caretakers.
 * Integrates with Google Gemini models (gemini-2.5-flash / gemini-1.5-flash).
 *
 * Safety & Privacy Architecture:
 * - Server-side only; API key is never exposed to the client.
 * - Strict system instructions forbidding diagnosis or prescription alterations.
 * - Facts vs. Observations separation.
 * - Deterministic, rule-based fallback when Gemini API is unavailable.
 * - Caches summaries in public.care_insights to minimize API calls and latency.
 */

import { createAdminClient } from "@/lib/supabase/admin";

export interface CareSummaryInput {
  profileName: string;
  age?: number;
  adherenceRate: number; // 0 - 100
  totalScheduledDoses: number;
  takenDoses: number;
  missedDoses: number;
  pendingDoses: number;
  unresolvedEscalations: number;
  upcomingAppointments: Array<{
    doctorName: string;
    specialty: string;
    clinicName: string;
    appointmentTime: string;
  }>;
  recentActivities: Array<{
    actionType: string;
    actorRole: string;
    createdAt: string;
  }>;
}

export interface CareSummaryOutput {
  summaryText: string;
  adherenceRate: number;
  status: "OPTIMAL" | "ATTENTION_NEEDED" | "CRITICAL_ACTION_REQUIRED";
  keyObservations: string[];
  recommendations: string[];
  generatedAt: string;
  isFallback: boolean;
  modelUsed?: string;
}

/**
 * Generate a rule-based deterministic summary when Gemini is offline or unconfigured.
 */
export function generateDeterministicCareSummary(input: CareSummaryInput): CareSummaryOutput {
  const observations: string[] = [];
  const recommendations: string[] = [];

  let status: CareSummaryOutput["status"] = "OPTIMAL";

  if (input.unresolvedEscalations > 0) {
    status = "CRITICAL_ACTION_REQUIRED";
    observations.push(
      `There are ${input.unresolvedEscalations} unacknowledged medication escalation alerts requiring prompt caretaker or family follow-up.`
    );
    recommendations.push("Directly check in with the assigned caretaker or call the elderly member.");
  } else if (input.missedDoses > 0 || input.adherenceRate < 80) {
    status = "ATTENTION_NEEDED";
    observations.push(
      `Medication adherence is at ${input.adherenceRate.toFixed(0)}% with ${input.missedDoses} missed dose(s) recorded in the current evaluation window.`
    );
    recommendations.push("Review medication schedule timing and ensure doses align with daily routine.");
  } else {
    observations.push(
      `Excellent adherence at ${input.adherenceRate.toFixed(0)}%. All scheduled doses are on track or taken on time.`
    );
    recommendations.push("Continue maintaining current routine and positive reinforcement.");
  }

  if (input.upcomingAppointments.length > 0) {
    const nextAppt = input.upcomingAppointments[0];
    const apptDate = new Date(nextAppt.appointmentTime).toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    observations.push(`Upcoming visit with ${nextAppt.doctorName} (${nextAppt.specialty}) at ${nextAppt.clinicName} on ${apptDate}.`);
    recommendations.push("Confirm transportation and companion accompaniment prior to the appointment.");
  }

  const summaryText = `Daily Care Summary for ${input.profileName}: Current adherence is ${input.adherenceRate.toFixed(0)}% (${input.takenDoses}/${input.totalScheduledDoses} doses confirmed). ${
    input.unresolvedEscalations > 0
      ? `Alert: ${input.unresolvedEscalations} escalation event(s) require attention.`
      : "No active escalations recorded."
  } ${input.upcomingAppointments.length} upcoming clinical appointment(s) scheduled.`;

  return {
    summaryText,
    adherenceRate: input.adherenceRate,
    status,
    keyObservations: observations,
    recommendations,
    generatedAt: new Date().toISOString(),
    isFallback: true,
    modelUsed: "deterministic-rule-engine",
  };
}

/**
 * Call Google Gemini API to synthesize an empathetic, clinical daily care brief.
 */
export async function generateGeminiCareSummary(
  input: CareSummaryInput
): Promise<CareSummaryOutput> {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    return generateDeterministicCareSummary(input);
  }

  const systemPrompt = `You are VATSALYA AI, an expert, empathetic geriatric care coordinator and family health communicator.
Your role is to produce a concise, reassuring, evidence-grounded daily brief for family members about their elderly loved one.

STRICT CLINICAL SAFETY RULES:
1. NEVER diagnose illnesses or medical conditions.
2. NEVER suggest changing medication dosages, altering schedules, or introducing new medicines.
3. NEVER invent or hallucinate missed doses or appointments not in the provided data.
4. Distinguish clearly between verifiable facts and gentle observational suggestions.
5. Emphasize elderly dignity, autonomy, and gentle family coordination.
6. Return output strictly in valid JSON format matching the schema below.`;

  const userPrompt = `Generate a daily care brief for:
Elderly Member: ${input.profileName} ${input.age ? `(Age: ${input.age})` : ""}
Adherence Rate: ${input.adherenceRate.toFixed(1)}% (${input.takenDoses} taken out of ${input.totalScheduledDoses} total scheduled doses)
Missed Doses: ${input.missedDoses}
Pending Doses: ${input.pendingDoses}
Unresolved Escalations: ${input.unresolvedEscalations}
Upcoming Appointments: ${JSON.stringify(input.upcomingAppointments)}
Recent Activities: ${JSON.stringify(input.recentActivities)}

Respond with JSON only in this exact structure:
{
  "summaryText": "Concise 2-3 sentence reassuring summary of the day's care state.",
  "status": "OPTIMAL" | "ATTENTION_NEEDED" | "CRITICAL_ACTION_REQUIRED",
  "keyObservations": ["Observation 1 grounded in data", "Observation 2 grounded in data"],
  "recommendations": ["Actionable step for family member 1", "Actionable step 2"]
}`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8-second safety timeout

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: 0.2, // Low temperature for high factual accuracy
          maxOutputTokens: 600,
          responseMimeType: "application/json",
        },
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      console.warn(`[Gemini API] Request returned status ${response.status}. Using deterministic fallback.`);
      return generateDeterministicCareSummary(input);
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      return generateDeterministicCareSummary(input);
    }

    const parsed = JSON.parse(rawText);

    return {
      summaryText: typeof parsed.summaryText === "string" ? parsed.summaryText : `Daily brief for ${input.profileName}.`,
      adherenceRate: input.adherenceRate,
      status: ["OPTIMAL", "ATTENTION_NEEDED", "CRITICAL_ACTION_REQUIRED"].includes(parsed.status)
        ? parsed.status
        : input.unresolvedEscalations > 0
        ? "CRITICAL_ACTION_REQUIRED"
        : "OPTIMAL",
      keyObservations: Array.isArray(parsed.keyObservations) ? parsed.keyObservations : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      generatedAt: new Date().toISOString(),
      isFallback: false,
      modelUsed: modelName,
    };
  } catch (err: unknown) {
    console.warn("[Gemini API] Exception during generation. Using deterministic fallback:", err instanceof Error ? err.message : err);
    return generateDeterministicCareSummary(input);
  }
}

/**
 * Fetch or generate cached care insight for a healthcare profile.
 */
export async function getOrGenerateProfileCareInsight(
  healthcareProfileId: string,
  profileName: string,
  forceRefresh = false
): Promise<CareSummaryOutput> {
  const supabase = createAdminClient();
  const now = new Date();

  // 1. Check cache unless forceRefresh is true
  if (!forceRefresh) {
    const { data: cached } = await supabase
      .from("care_insights")
      .select("*")
      .eq("healthcare_profile_id", healthcareProfileId)
      .eq("insight_type", "DAILY_BRIEF")
      .gt("expires_at", now.toISOString())
      .order("generated_at", { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      return {
        summaryText: cached.summary_text,
        adherenceRate: Number(cached.adherence_rate || 100),
        status: (cached.key_observations as Record<string, unknown>)?.status as CareSummaryOutput["status"] || "OPTIMAL",
        keyObservations: ((cached.key_observations as Record<string, unknown>)?.observations as string[]) || [],
        recommendations: ((cached.key_observations as Record<string, unknown>)?.recommendations as string[]) || [],
        generatedAt: cached.generated_at,
        isFallback: false,
        modelUsed: "cached-care-insight",
      };
    }
  }

  // 2. Aggregate real data for the profile
  const [dosesRes, escalationsRes, apptsRes, activitiesRes] = await Promise.all([
    supabase
      .from("dose_logs")
      .select("status, scheduled_time")
      .eq("healthcare_profile_id", healthcareProfileId)
      .gte("scheduled_time", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    supabase
      .from("escalation_events")
      .select("id, status")
      .eq("healthcare_profile_id", healthcareProfileId)
      .eq("status", "TRIGGERED"),
    supabase
      .from("appointments")
      .select("doctor_name, specialty, clinic_name, appointment_time")
      .eq("healthcare_profile_id", healthcareProfileId)
      .eq("status", "SCHEDULED")
      .gte("appointment_time", now.toISOString())
      .order("appointment_time", { ascending: true })
      .limit(3),
    supabase
      .from("care_activities")
      .select("action_type, actor_role, created_at")
      .eq("healthcare_profile_id", healthcareProfileId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const doses = dosesRes.data || [];
  const totalDoses = doses.length;
  const takenCount = doses.filter((d) => d.status === "TAKEN").length;
  const missedCount = doses.filter((d) => d.status === "MISSED").length;
  const pendingCount = doses.filter((d) => d.status === "SCHEDULED").length;
  const adherenceRate = totalDoses > 0 ? (takenCount / totalDoses) * 100 : 100;

  const summaryInput: CareSummaryInput = {
    profileName,
    adherenceRate,
    totalScheduledDoses: totalDoses,
    takenDoses: takenCount,
    missedDoses: missedCount,
    pendingDoses: pendingCount,
    unresolvedEscalations: (escalationsRes.data || []).length,
    upcomingAppointments: (apptsRes.data || []).map((a) => ({
      doctorName: a.doctor_name,
      specialty: a.specialty,
      clinicName: a.clinic_name,
      appointmentTime: a.appointment_time,
    })),
    recentActivities: (activitiesRes.data || []).map((act) => ({
      actionType: act.action_type,
      actorRole: act.actor_role,
      createdAt: act.created_at,
    })),
  };

  const output = await generateGeminiCareSummary(summaryInput);

  // 3. Cache result in public.care_insights (expires in 4 hours)
  const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();
  await supabase.from("care_insights").insert({
    healthcare_profile_id: healthcareProfileId,
    insight_type: "DAILY_BRIEF",
    summary_text: output.summaryText,
    adherence_rate: output.adherenceRate,
    key_observations: {
      status: output.status,
      observations: output.keyObservations,
      recommendations: output.recommendations,
      isFallback: output.isFallback,
      modelUsed: output.modelUsed,
    },
    expires_at: expiresAt,
  });

  return output;
}
