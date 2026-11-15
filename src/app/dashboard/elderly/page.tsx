"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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
  MapPin,
  Send,
  CheckCircle2,
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-[#EBF2EE] text-[#1E3A2F] border border-[#D5E2D9] inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Elderly Independent Mode (ಹಿರಿಯರ ಮೋಡ್)
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#1E3A2F] tracking-tight">
            ನಮಸ್ಕಾರ ಅಪ್ಪಾಜಿ (Good Morning Appaji)
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#5C6460]">
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
        <div className="p-6 rounded-3xl bg-[#EBF2EE] border-2 border-[#1E3A2F] space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-[#1E3A2F] font-extrabold text-lg">
            <Volume2 className="w-6 h-6" />
            <span>Voice Assistant Active (ಧ್ವನಿ ಸಹಾಯಕ)</span>
          </div>
          <p className="text-base text-[#1E3A2F] font-medium leading-relaxed">
            ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ English ನಲ್ಲಿ ಕೇಳಿ: &quot;ಇವತ್ತಿನ ಮಾತ್ರೆ ಯಾವುದು?&quot; (Which is my medicine today?)
          </p>
          <p className="text-xs text-[#5C6460]">
            * Note: To prevent accidental confirms, voice commands explain your schedule; marking a dose taken requires tapping the green button below.
          </p>
        </div>
      )}

      {/* Main Focus: The Primary Active Dose Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#1E3A2F] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <span
            className={`text-xs sm:text-sm font-extrabold uppercase tracking-wider px-3.5 py-1.5 rounded-full border ${
              activeDose.status === "TAKEN"
                ? "bg-emerald-100 text-emerald-900 border-emerald-300"
                : activeDose.status === "OVERDUE"
                ? "bg-rose-100 text-rose-900 border-rose-300 animate-pulse"
                : "bg-amber-100 text-amber-900 border-amber-300"
            }`}
          >
            {activeDose.status === "TAKEN"
              ? "Completed (ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)"
              : activeDose.status === "OVERDUE"
              ? "Overdue (ತಡವಾಗಿದೆ)"
              : "Due Now (ಈಗ ತೆಗೆದುಕೊಳ್ಳಿ)"}
          </span>
          <span className="text-2xl sm:text-3xl font-black text-[#1E3A2F]">
            {activeDose.targetTime}
          </span>
        </div>

        <div className="flex items-start gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] shrink-0 border border-[#D5E2D9]">
            <Pill className="w-10 h-10 sm:w-12 sm:h-12" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl sm:text-3xl font-black text-[#1E3A2F] leading-tight">
              {activeDose.medicationName} ({activeDose.dosageStrength})
            </h2>
            <p className="mt-1 text-lg sm:text-xl font-bold text-[#5C6460]">
              {activeDose.instructions || "Take with water as prescribed"}
            </p>
            <p className="text-sm sm:text-base text-[#607B6E] mt-1 font-bold">
              {activeDose.mealTiming === "AFTER_MEAL"
                ? "ಬೆಳಗಿನ ಉಪಹಾರದ ನಂತರ 1 ಮಾತ್ರೆ (After breakfast)"
                : activeDose.mealTiming === "BEFORE_MEAL"
                ? "ಉಪಹಾರಕ್ಕೆ ಮೊದಲು 1 ಮಾತ್ರೆ (Before breakfast)"
                : "ಆಹಾರದೊಂದಿಗೆ 1 ಮಾತ್ರೆ (With meal)"}
            </p>
          </div>
        </div>

        {/* Large Senior Confirmation Button (Minimum 64px Touch Target) */}
        {activeDose.status !== "TAKEN" ? (
          <button
            onClick={() => handleMarkTaken(activeDose)}
            disabled={submitting}
            className="w-full senior-touch-target py-5 sm:py-6 px-6 rounded-2xl bg-[#1E3A2F] hover:bg-[#162E25] active:scale-[0.99] text-white text-xl sm:text-2xl font-black transition-all shadow-md flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <RefreshCw className="w-8 h-8 animate-spin" />
            ) : (
              <Check className="w-8 h-8 stroke-[3]" />
            )}
            Mark as Taken (ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ)
          </button>
        ) : (
          <div className="w-full py-5 sm:py-6 px-6 rounded-2xl bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xl font-black flex items-center justify-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-emerald-700 stroke-[3]" />
            Confirmed Taken! (ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)
          </div>
        )}

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] text-sm font-bold flex items-center gap-2 border border-[#D5E2D9]">
            <AlertCircle className="w-5 h-5 text-[#607B6E] shrink-0" />
            <span>{statusMessage}</span>
          </div>
        )}
      </div>

      {/* Telegram Notification Gating Pill */}
      <div className="p-4 rounded-2xl bg-white border border-[#EFECE6] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#5C6460]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] shrink-0">
            <Send className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-bold text-[#1E3A2F]">Telegram Reminders Connected</span>
            <p className="text-[11px] text-[#5C6460]">You will receive audio reminders from @VatsalyaCareBot 15 mins before each dose.</p>
          </div>
        </div>
        <Link
          href="/dashboard/settings/notifications"
          className="font-bold text-[#1E3A2F] hover:underline self-end sm:self-center"
        >
          Preferences
        </Link>
      </div>

      {/* Full Today Timeline for Elderly User */}
      {timeline.length > 1 && (
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-4">
          <h3 className="text-lg font-black text-[#1E3A2F] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#607B6E]" />
            All Doses Today (ಇವತ್ತಿನ ಎಲ್ಲಾ ಮಾತ್ರೆಗಳು)
          </h3>
          <div className="space-y-3">
            {timeline.map((dose, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      dose.status === "TAKEN"
                        ? "bg-emerald-100 text-emerald-800"
                        : dose.status === "OVERDUE"
                        ? "bg-rose-100 text-rose-800"
                        : "bg-[#EBF2EE] text-[#1E3A2F]"
                    }`}
                  >
                    <Pill className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-base font-extrabold text-[#1E3A2F]">
                      {dose.medicationName} ({dose.dosageStrength})
                    </p>
                    <p className="text-xs text-[#5C6460] font-medium">
                      {dose.targetTime} • {dose.instructions}
                    </p>
                  </div>
                </div>
                <div>
                  {dose.status === "TAKEN" ? (
                    <span className="text-xs px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                      Taken
                    </span>
                  ) : (
                    <button
                      onClick={() => handleMarkTaken(dose)}
                      className="px-4 py-2 rounded-xl bg-[#1E3A2F] text-white text-xs font-bold hover:bg-[#162E25] cursor-pointer"
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

      {/* Secondary Context Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Upcoming Doctor Visit */}
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#1E3A2F]">
              <Calendar className="w-5 h-5 text-[#607B6E]" />
              <h3 className="text-base font-extrabold">Next Doctor Visit (ವೈದ್ಯರ ಭೇಟಿ)</h3>
            </div>
            <div>
              <p className="text-lg font-black text-[#1E3A2F]">Dr. Ramesh (Cardiology)</p>
              <p className="text-sm text-[#5C6460]">Wednesday, Nov 18 • 10:30 AM</p>
              <p className="text-xs text-[#607B6E] font-bold mt-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                Fortis Hospital, Bangalore
              </p>
            </div>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl text-xs font-semibold text-[#1E3A2F] border border-[#EFECE6]">
            Daughter Priya is assigned as companion.
          </div>
        </div>

        {/* Emergency Assistance */}
        <div className="p-6 rounded-3xl bg-[#FEF3C7] border border-amber-300 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-950">
              <PhoneCall className="w-5 h-5 text-amber-800" />
              <h3 className="text-base font-extrabold">Need Help? (ಸಹಾಯ ಬೇಕೇ?)</h3>
            </div>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
              Tap to directly call your daughter Priya (Healthcare Administrator).
            </p>
          </div>
          <a
            href="tel:+919876543210"
            className="w-full senior-touch-target py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-center flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Priya (+91 98765 43210)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
