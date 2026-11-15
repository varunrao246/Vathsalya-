"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Volume2,
  PhoneCall,
  Calendar,
  Mic,
  HeartHandshake,
  Loader2,
} from "lucide-react";
import type { DoseOccurrence } from "@/lib/medications/dose-engine";
import { useDashboard } from "@/context/DashboardContext";

export default function ElderlyDashboard() {
  const { user, activeProfile, isDemo, loading: dashboardLoading } = useDashboard();

  const [timeline, setTimeline] = useState<DoseOccurrence[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [voiceActive, setVoiceActive] = useState(false);

  const fetchTimeline = useCallback(async (profileId: string) => {
    try {
      const res = await fetch(`/api/doses/today?healthcareProfileId=${profileId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.timeline)) {
        setTimeline(json.data.timeline);
      } else {
        setTimeline([]);
      }
    } catch {
      setTimeline([]);
    }
  }, []);

  useEffect(() => {
    if (activeProfile) {
      fetchTimeline(activeProfile.id);
    } else {
      setTimeline([]);
    }
  }, [activeProfile, fetchTimeline]);

  // Locate the most pressing dose (DUE, OVERDUE, or next UPCOMING)
  const activeDose =
    timeline.find((d) => d.status === "DUE" || d.status === "OVERDUE") ||
    timeline.find((d) => d.status === "UPCOMING") ||
    timeline[0] ||
    null;

  const handleMarkTaken = async (dose: DoseOccurrence) => {
    if (!activeProfile) return;
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
          healthcareProfileId: activeProfile.id,
          scheduleId: dose.scheduleId,
          scheduledAt: dose.scheduledAt,
          scheduledDate: dose.scheduledDate,
          scheduledTime: dose.scheduledTime,
          action: "TAKEN",
          notes: `Confirmed directly on elderly dashboard for ${activeProfile.displayName}`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setStatusMessage("ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ • Dose confirmed! Great job.");
        fetchTimeline(activeProfile.id);
      } else {
        setStatusMessage(json.error?.message || "Could not save confirmation.");
      }
    } catch {
      setStatusMessage("Failed to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#1E3A2F] animate-spin" />
        <p className="text-sm font-bold text-[#5C6460]">Loading elderly care view...</p>
      </div>
    );
  }

  // Empty state if authenticated without profile
  if (!activeProfile && !isDemo) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center mx-auto shadow-xs">
          <HeartHandshake className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A2F]">
            ನಮಸ್ಕಾರ (Welcome, {user?.fullName || "User"})
          </h1>
          <p className="text-sm text-[#5C6460]">
            You do not have an active elderly healthcare profile linked yet. Set up your profile or join with a family invitation code to view your daily schedule.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/onboard"
            className="px-5 py-3 rounded-xl bg-[#1E3A2F] text-white font-bold text-sm hover:bg-[#162E25]"
          >
            Create My Healthcare Profile
          </Link>
          <Link
            href="/join"
            className="px-5 py-3 rounded-xl bg-white border border-[#EFECE6] text-[#1E3A2F] font-bold text-sm hover:bg-[#FAF8F5]"
          >
            Join Family Profile
          </Link>
        </div>
      </div>
    );
  }

  const patientDisplayName = activeProfile?.displayName || "ಅಪ್ಪಾಜಿ";
  const emergencyName = activeProfile?.emergencyContactName || "Family Caregiver";
  const emergencyPhone = activeProfile?.emergencyContactPhone || "";

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
            ನಮಸ್ಕಾರ {patientDisplayName} (Good Morning {patientDisplayName})
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#5C6460]">
            Care Schedule • {activeProfile?.timezone || "Asia/Kolkata"}
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

      {/* Voice Assistant Drawer */}
      {voiceActive && (
        <div className="p-6 rounded-3xl bg-[#EBF2EE] border-2 border-[#1E3A2F] space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 text-[#1E3A2F] font-extrabold text-lg">
            <Volume2 className="w-6 h-6" />
            <span>Voice Assistant Active (ಧ್ವನಿ ಸಹಾಯಕ)</span>
          </div>
          <p className="text-base text-[#1E3A2F]">
            &quot;ಅಪ್ಪಾಜಿ, ನಿಮ್ಮ ಬೆಳಗಿನ ಬಿಪಿ ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ.&quot;
            <br />
            <span className="text-sm text-[#5C6460] font-normal">
              (It is time for your scheduled morning medication. Tap the green button below once taken.)
            </span>
          </p>
        </div>
      )}

      {/* Primary Action Hero Card (Senior-Centric Tap Target) */}
      {activeDose ? (
        <div
          className={`p-6 sm:p-8 rounded-3xl border-2 transition-all space-y-6 ${
            activeDose.status === "TAKEN"
              ? "bg-emerald-50/70 border-emerald-300"
              : activeDose.status === "OVERDUE"
              ? "bg-rose-50/70 border-rose-300"
              : "bg-white border-[#1E3A2F] shadow-sm"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span
                className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                  activeDose.status === "TAKEN"
                    ? "bg-emerald-100 text-emerald-900"
                    : activeDose.status === "OVERDUE"
                    ? "bg-rose-100 text-rose-900 animate-pulse"
                    : "bg-[#EBF2EE] text-[#1E3A2F]"
                }`}
              >
                {activeDose.status === "TAKEN"
                  ? "✓ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ (Already Taken)"
                  : activeDose.status === "OVERDUE"
                  ? "⚠️ ಮರೆತುಹೋಗಿದೆ (Overdue Medication)"
                  : "ಮಾತ್ರೆ ಸಮಯ (Time for Medicine)"}
              </span>

              <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#1E3A2F]">
                {activeDose.medicationName} ({activeDose.dosageStrength})
              </h2>
              <p className="text-base sm:text-lg text-[#5C6460] font-medium mt-1">
                {activeDose.instructions || "Take with fresh water"} • {activeDose.mealTiming?.replace(/_/g, " ")}
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7" />
            </div>
          </div>

          {/* Large Senior Button */}
          {activeDose.status !== "TAKEN" ? (
            <button
              onClick={() => handleMarkTaken(activeDose)}
              disabled={submitting}
              className="w-full senior-touch-target py-5 sm:py-6 px-6 rounded-2xl bg-[#1E3A2F] hover:bg-[#162E25] text-white text-lg sm:text-xl font-black flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              <span>
                {submitting ? "ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ..." : "ನಾನು ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ (I Have Taken This)"}
              </span>
            </button>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <span>ಧನ್ಯವಾದಗಳು! ಇಂದಿನ ಡೋಸ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ (Dose successfully recorded)</span>
            </div>
          )}

          {statusMessage && (
            <p className="text-center text-sm font-bold text-[#1E3A2F] animate-in fade-in">
              {statusMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#EFECE6] space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-bold text-[#1E3A2F]">ಎಲ್ಲಾ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ</h2>
          <p className="text-sm text-[#5C6460]">No pending doses scheduled for today for {patientDisplayName}.</p>
        </div>
      )}

      {/* Rest of Today's Doses */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-[#1E3A2F]">
          ಇಂದಿನ ಇತರ ಮಾತ್ರೆಗಳು (Other Medicines Today)
        </h3>
        <div className="space-y-3">
          {timeline.length > 0 ? (
            timeline.map((dose, index) => (
              <div
                key={index}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EFECE6] flex items-center justify-between"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#1E3A2F] flex items-center justify-center font-bold">
                    {dose.targetTime}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-[#1E3A2F]">{dose.medicationName}</h4>
                    <p className="text-xs text-[#5C6460]">{dose.dosageStrength} • {dose.instructions}</p>
                  </div>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    dose.status === "TAKEN"
                      ? "bg-emerald-100 text-emerald-900"
                      : dose.status === "OVERDUE"
                      ? "bg-rose-100 text-rose-900"
                      : "bg-[#EBF2EE] text-[#5C6460]"
                  }`}
                >
                  {dose.status === "TAKEN"
                    ? "ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ (Taken)"
                    : dose.status === "OVERDUE"
                    ? "ಬಾಕಿ ಇದೆ (Overdue)"
                    : "ಮುಂದಿನ ಡೋಸ್ (Upcoming)"}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-[#5C6460] bg-[#FAF8F5] rounded-xl border border-[#EFECE6]">
              No scheduled medications found.
            </div>
          )}
        </div>
      </div>

      {/* Secondary Cards: Doctor Visit & Direct Companion Call */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#1E3A2F]">
              <Calendar className="w-5 h-5 text-[#607B6E]" />
              <h3 className="text-base font-extrabold">Next Doctor Visit (ವೈದ್ಯರ ಭೇಟಿ)</h3>
            </div>
            <div>
              <p className="text-lg font-black text-[#1E3A2F]">
                {activeProfile?.doctorName ? `Dr. ${activeProfile.doctorName}` : "Routine Health Checkup"}
              </p>
              <p className="text-sm text-[#5C6460]">
                {activeProfile?.hospitalName || "Bangalore Clinic"}
              </p>
            </div>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl text-xs font-semibold text-[#1E3A2F] border border-[#EFECE6]">
            Companion: {emergencyName}
          </div>
        </div>

        {/* Emergency Assistance with Dynamic Family Contact */}
        <div className="p-6 rounded-3xl bg-[#FEF3C7] border border-amber-300 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-950">
              <PhoneCall className="w-5 h-5 text-amber-800" />
              <h3 className="text-base font-extrabold">Need Help? (ಸಹಾಯ ಬೇಕೇ?)</h3>
            </div>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
              Tap below to directly call your emergency contact {emergencyName}.
            </p>
          </div>
          <a
            href={emergencyPhone ? `tel:${emergencyPhone.replace(/\s+/g, "")}` : "#"}
            className="w-full senior-touch-target py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-center flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call {emergencyName} {emergencyPhone ? `(${emergencyPhone})` : ""}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
