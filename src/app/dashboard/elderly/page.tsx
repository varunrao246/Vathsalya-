"use client";

import { useState, useEffect } from "react";
import {
  Check,
  PhoneCall,
  Mic,
  Calendar,
  Volume2,
  Pill,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import type { DoseOccurrence } from "@/lib/medications/dose-engine";

// Default demo fallback doses if no backend connection
const DEFAULT_DOSE: DoseOccurrence = {
  scheduleId: "demo-sched-1",
  medicationId: "demo-med-1",
  medicationName: "Telmisartan",
  dosageStrength: "40 mg",
  dosageForm: "Tablet",
  instructions: "Take 1 tablet after breakfast with water",
  targetTime: "08:30",
  scheduledAt: new Date().toISOString(),
  scheduledDate: new Date().toISOString().split("T")[0],
  scheduledTime: "08:30",
  occurrenceKey: `demo-sched-1_${new Date().toISOString().split("T")[0]}T08:30:00`,
  mealTiming: "AFTER_MEAL",
  doseQuantity: 1,
  status: "DUE",
};

export default function ElderlyDashboard() {
  const [timeline, setTimeline] = useState<DoseOccurrence[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  useEffect(() => {
    let ignore = false;
    async function fetchTimeline() {
      try {
        const res = await fetch("/api/doses/today?healthcareProfileId=demo-profile-appaji");
        const json = await res.json();
        if (!ignore) {
          if (json.success && json.data.timeline && json.data.timeline.length > 0) {
            setTimeline(json.data.timeline);
          } else {
            setTimeline([DEFAULT_DOSE]);
          }
        }
      } catch {
        if (!ignore) {
          setTimeline([DEFAULT_DOSE]);
        }
      }
    }
    fetchTimeline();
    return () => {
      ignore = true;
    };
  }, []);

  // Locate the most pressing dose (DUE, OVERDUE, or next UPCOMING)
  const activeDose =
    timeline.find((d) => d.status === "DUE" || d.status === "OVERDUE") ||
    timeline.find((d) => d.status === "UPCOMING") ||
    timeline[0] ||
    DEFAULT_DOSE;

  const handleMarkTaken = async (dose: DoseOccurrence) => {
    setSubmitting(true);
    setStatusMessage(null);

    // Haptic vibration feedback on supported devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    try {
      const res = await fetch("/api/doses/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthcareProfileId: "demo-profile-appaji",
          scheduleId: dose.scheduleId,
          scheduledAt: dose.scheduledAt,
          scheduledDate: dose.scheduledDate,
          scheduledTime: dose.scheduledTime,
          action: "TAKEN",
          notes: "Confirmed directly by Appaji on elderly dashboard",
        }),
      });

      const json = await res.json();

      if (res.status === 409) {
        setStatusMessage("This dose was already recorded as taken. (ಈಗಾಗಲೇ ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)");
      } else if (res.ok || json.success) {
        setStatusMessage("Dose confirmed taken! (ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)");
      } else {
        // Fallback for simulation / preview mode
        setStatusMessage("Dose recorded in preview mode. (ಖಚಿತಪಡಿಸಲಾಗಿದೆ)");
      }

      // Optimistically update timeline
      setTimeline((prev) =>
        prev.map((item) =>
          item.occurrenceKey === dose.occurrenceKey
            ? {
                ...item,
                status: "TAKEN" as const,
                recordedAt: new Date().toISOString(),
                actorRole: "ELDERLY",
              }
            : item
        )
      );
    } catch {
      // Local optimistic update
      setTimeline((prev) =>
        prev.map((item) =>
          item.occurrenceKey === dose.occurrenceKey
            ? {
                ...item,
                status: "TAKEN" as const,
                recordedAt: new Date().toISOString(),
                actorRole: "ELDERLY",
              }
            : item
        )
      );
      setStatusMessage("Dose confirmed taken! (ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Role Banner / Context */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
            Elderly Independent Mode (ಹಿರಿಯರ ಮೋಡ್)
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1E3A2F]">
            ನಮಸ್ಕಾರ ಅಪ್ಪಾಜಿ (Good Morning Appaji)
          </h1>
          <p className="mt-1 text-lg text-[#5C6460]">
            Today is Sunday, 15 November • Bangalore
          </p>
        </div>

        {/* Voice Trigger Bubble */}
        <button
          onClick={() => setVoiceActive(!voiceActive)}
          className={`senior-touch-target p-4 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
            voiceActive
              ? "bg-[#B45309] text-white animate-pulse"
              : "bg-[#1E3A2F] text-white hover:bg-[#162E25]"
          }`}
          aria-label="Voice Assistant in Kannada and English"
        >
          <Mic className="w-8 h-8" />
        </button>
      </div>

      {/* Voice Assistant Mock Drawer */}
      {voiceActive && (
        <div className="p-6 rounded-3xl bg-[#EBF2EE] border-2 border-[#1E3A2F] space-y-3">
          <div className="flex items-center gap-2 text-[#1E3A2F] font-bold text-lg">
            <Volume2 className="w-6 h-6" />
            <span>Voice Assistant Active (ಧ್ವನಿ ಸಹಾಯಕ)</span>
          </div>
          <p className="text-base text-[#1E3A2F]">
            ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ English ನಲ್ಲಿ ಕೇಳಿ: &quot;ಇವತ್ತಿನ ಮಾತ್ರೆ ಯಾವುದು?&quot; (Which is my medicine today?)
          </p>
          <p className="text-xs text-[#5C6460]">
            * Note: To prevent accidental confirms, voice commands explain your schedule; marking a dose taken requires tapping the green button below.
          </p>
        </div>
      )}

      {/* Main Focus: The Primary Active Dose Card */}
      <div className="p-8 rounded-3xl bg-white border-2 border-[#1E3A2F] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold uppercase tracking-wider px-3.5 py-1 rounded-full border ${
                activeDose.status === "TAKEN"
                  ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                  : activeDose.status === "OVERDUE"
                  ? "bg-rose-100 text-rose-900 border-rose-300 animate-pulse"
                  : "bg-amber-100 text-amber-900 border-amber-200"
              }`}
            >
              {activeDose.status === "TAKEN"
                ? "Completed (ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)"
                : activeDose.status === "OVERDUE"
                ? "Overdue (ತಡವಾಗಿದೆ)"
                : "Due Now (ಈಗ ತೆಗೆದುಕೊಳ್ಳಿ)"}
            </span>
          </div>
          <span className="text-2xl font-extrabold text-[#1E3A2F]">
            {activeDose.targetTime}
          </span>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] shrink-0">
            <Pill className="w-9 h-9" />
          </div>
          <div className="flex-1">
            <h2 className="text-3xl font-extrabold text-[#1E3A2F]">
              {activeDose.medicationName} ({activeDose.dosageStrength})
            </h2>
            <p className="mt-1 text-xl font-medium text-[#5C6460]">
              {activeDose.instructions || "Take with water as prescribed"}
            </p>
            <p className="text-base text-[#607B6E] mt-0.5 font-medium">
              {activeDose.mealTiming === "AFTER_MEAL"
                ? "ಬೆಳಗಿನ ಉಪಹಾರದ ನಂತರ 1 ಮಾತ್ರೆ (After meal)"
                : activeDose.mealTiming === "BEFORE_MEAL"
                ? "ಉಪಹಾರಕ್ಕೆ ಮೊದಲು 1 ಮಾತ್ರೆ (Before meal)"
                : "ಆಹಾರದೊಂದಿಗೆ 1 ಮಾತ್ರೆ (With meal)"}
            </p>
          </div>
        </div>

        {/* Large Confirmation Button (min 64px touch target) */}
        {activeDose.status !== "TAKEN" ? (
          <button
            onClick={() => handleMarkTaken(activeDose)}
            disabled={submitting}
            className="w-full senior-touch-target py-5 px-6 rounded-2xl bg-[#1E3A2F] hover:bg-[#162E25] active:scale-[0.99] text-white text-2xl font-bold transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <Check className="w-8 h-8 stroke-[3]" />
            )}
            Mark as Taken (ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ)
          </button>
        ) : (
          <div className="w-full py-5 px-6 rounded-2xl bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xl font-bold flex items-center justify-center gap-3">
            <Check className="w-8 h-8 text-emerald-700 stroke-[3]" />
            Confirmed Taken! (ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)
          </div>
        )}

        {statusMessage && (
          <div className="p-3 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-[#607B6E] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Full Today Timeline for Elderly User */}
      {timeline.length > 1 && (
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-4">
          <h3 className="text-lg font-bold text-[#1E3A2F] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#607B6E]" />
            All Doses Today (ಇವತ್ತಿನ ಎಲ್ಲಾ ಮಾತ್ರೆಗಳು)
          </h3>
          <div className="space-y-3">
            {timeline.map((dose, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                      dose.status === "TAKEN"
                        ? "bg-emerald-100 text-emerald-800"
                        : dose.status === "OVERDUE"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-[#EBF2EE] text-[#1E3A2F]"
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-base font-bold text-[#1E3A2F]">
                      {dose.medicationName} ({dose.dosageStrength})
                    </p>
                    <p className="text-xs text-[#5C6460]">
                      {dose.targetTime} • {dose.instructions}
                    </p>
                  </div>
                </div>
                <div>
                  {dose.status === "TAKEN" ? (
                    <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                      Taken
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkTaken(dose)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#1E3A2F] text-white text-xs font-bold hover:bg-[#162E25]"
                    >
                      Take
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Secondary Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Upcoming Doctor Visit */}
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-3">
          <div className="flex items-center gap-2 text-[#1E3A2F]">
            <Calendar className="w-6 h-6 text-[#607B6E]" />
            <h3 className="text-lg font-bold">Next Doctor Visit</h3>
          </div>
          <div>
            <p className="text-xl font-bold text-[#1E3A2F]">Dr. Ramesh (Cardiology)</p>
            <p className="text-base text-[#5C6460]">Wednesday, Nov 18 • 10:30 AM</p>
            <p className="text-sm text-[#607B6E] font-medium mt-1">
              Daughter Priya is accompanying you
            </p>
          </div>
        </div>

        {/* Emergency Assistance */}
        <div className="p-6 rounded-3xl bg-[#FEF3C7] border border-amber-300 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-950">
              <PhoneCall className="w-6 h-6 text-amber-800" />
              <h3 className="text-lg font-bold">Need Help? (ಸಹಾಯ ಬೇಕೇ?)</h3>
            </div>
            <p className="mt-1 text-sm text-amber-900">
              Tap to call your primary contact Priya directly.
            </p>
          </div>
          <a
            href="tel:+919876543210"
            className="w-full senior-touch-target py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-center flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-5 h-5" />
            Call Priya (+91 98765 43210)
          </a>
        </div>
      </div>
    </div>
  );
}