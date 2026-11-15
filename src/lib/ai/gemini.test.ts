import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  generateDeterministicCareSummary,
  generateGeminiCareSummary,
  CareSummaryInput,
} from "./gemini";

describe("Gemini AI Care Summary Engine", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const baseInput: CareSummaryInput = {
    profileName: "Smt. Kamala Rao",
    age: 78,
    adherenceRate: 100,
    totalScheduledDoses: 14,
    takenDoses: 14,
    missedDoses: 0,
    pendingDoses: 0,
    unresolvedEscalations: 0,
    upcomingAppointments: [
      {
        doctorName: "Dr. Ananth Kumar",
        specialty: "Cardiology",
        clinicName: "Manipal Hospital",
        appointmentTime: "2026-11-20T10:30:00Z",
      },
    ],
    recentActivities: [],
  };

  it("generates an OPTIMAL deterministic summary when adherence is 100% and no escalations exist", () => {
    const result = generateDeterministicCareSummary(baseInput);

    expect(result.status).toBe("OPTIMAL");
    expect(result.adherenceRate).toBe(100);
    expect(result.isFallback).toBe(true);
    expect(result.summaryText).toContain("Daily Care Summary for Smt. Kamala Rao");
    expect(result.keyObservations.length).toBeGreaterThan(0);
    expect(result.keyObservations.some((o) => o.includes("Dr. Ananth Kumar"))).toBe(true);
  });

  it("generates ATTENTION_NEEDED when adherence drops or missed doses exist", () => {
    const input: CareSummaryInput = {
      ...baseInput,
      adherenceRate: 75,
      takenDoses: 3,
      missedDoses: 1,
      totalScheduledDoses: 4,
    };

    const result = generateDeterministicCareSummary(input);

    expect(result.status).toBe("ATTENTION_NEEDED");
    expect(result.keyObservations.some((o) => o.includes("75%"))).toBe(true);
  });

  it("generates CRITICAL_ACTION_REQUIRED when unresolved escalations exist", () => {
    const input: CareSummaryInput = {
      ...baseInput,
      unresolvedEscalations: 2,
    };

    const result = generateDeterministicCareSummary(input);

    expect(result.status).toBe("CRITICAL_ACTION_REQUIRED");
    expect(result.keyObservations.some((o) => o.includes("2 unacknowledged medication escalation alerts"))).toBe(true);
  });

  it("gracefully falls back to deterministic summary when GEMINI_API_KEY is not configured", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    try {
      const result = await generateGeminiCareSummary(baseInput);
      expect(result.isFallback).toBe(true);
      expect(result.status).toBe("OPTIMAL");
      expect(result.modelUsed).toBe("deterministic-rule-engine");
    } finally {
      process.env.GEMINI_API_KEY = originalKey;
    }
  });

  it("handles fetch errors safely without throwing", async () => {
    process.env.GEMINI_API_KEY = "dummy-test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("Network connection timed out"))
    );

    const result = await generateGeminiCareSummary(baseInput);
    expect(result.isFallback).toBe(true);
    expect(result.summaryText).toContain("Kamala Rao");
  });

  it("parses valid JSON candidate from Gemini response", async () => {
    process.env.GEMINI_API_KEY = "dummy-test-key";
    const mockJson = {
      candidates: [
        {
          content: {
            parts: [
              {
                text: JSON.stringify({
                  summaryText: "Kamala is doing wonderfully today with 100% adherence.",
                  status: "OPTIMAL",
                  keyObservations: ["All morning and evening doses were taken promptly."],
                  recommendations: ["Congratulate her on keeping up the great routine."],
                }),
              },
            ],
          },
        },
      ],
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockJson,
      })
    );

    const result = await generateGeminiCareSummary(baseInput);
    expect(result.isFallback).toBe(false);
    expect(result.summaryText).toBe("Kamala is doing wonderfully today with 100% adherence.");
    expect(result.status).toBe("OPTIMAL");
    expect(result.recommendations).toHaveLength(1);
  });
});
