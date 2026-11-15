"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Sparkles,
  Shield,
  UserPlus,
  Pill,
  Calendar,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import type { DoseOccurrence } from "@/lib/medications/dose-engine";

export default function FamilyDashboard() {
  const [timeline, setTimeline] = useState<DoseOccurrence[]>([]);
  const [adherence, setAdherence] = useState({ total: 3, taken: 1, percent: 94 });

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch("/api/doses/today?healthcareProfileId=demo-profile-appaji");
        const json = await res.json();
        if (json.success && json.data.timeline) {
          setTimeline(json.data.timeline);
          if (json.data.summary) {
            setAdherence({
              total: json.data.summary.total,
              taken: json.data.summary.taken,
              percent: json.data.summary.adherencePercentage,
            });
          }
        }
      } catch {
        // Fallback default timeline
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
            Family Member Overview Mode
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1E3A2F]">
            Appaji&apos;s Healthcare Overview
          </h1>
          <p className="text-sm text-[#5C6460]">
            Logged in as Priya Sharma (Daughter &amp; Healthcare Administrator)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/medications"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A2F] text-white text-sm font-semibold hover:bg-[#162E25] shadow-xs"
          >
            <Pill className="w-4 h-4 text-[#EBF2EE]" />
            Manage Medications &amp; Schedules
          </Link>
          <Link
            href="/join"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-white text-sm font-semibold text-[#1E3A2F] hover:border-[#607B6E] shadow-xs"
          >
            <UserPlus className="w-4 h-4 text-[#607B6E]" />
            Invite Member (Passcode)
          </Link>
        </div>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
              7-Day Adherence
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#1E3A2F]">{adherence.percent}%</span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              +4% vs last week
            </span>
          </div>
          <p className="mt-2 text-xs text-[#5C6460]">
            17 of 18 scheduled doses confirmed on time.
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
              Today&apos;s Doses
            </span>
            <Clock className="w-4 h-4 text-[#607B6E]" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold text-[#1E3A2F]">
              {adherence.taken} of {adherence.total}
            </span>
            <span className="text-xs font-semibold text-[#607B6E]">Taken</span>
          </div>
          <p className="mt-2 text-xs text-[#5C6460]">
            Next dose: Metformin 500mg at 01:30 PM (With Lunch).
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
              Next Consultation
            </span>
            <Calendar className="w-4 h-4 text-[#607B6E]" />
          </div>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-xl font-extrabold text-[#1E3A2F]">Wednesday</span>
            <span className="text-sm font-medium text-[#5C6460]">10:30 AM</span>
          </div>
          <p className="mt-2 text-xs text-[#5C6460]">
            Dr. Ramesh (Cardiologist, Manipal Hospital).
          </p>
        </div>
      </div>

      {/* AI Daily Care Brief (Google Gemini) */}
      <div className="p-8 rounded-3xl bg-[#EBF2EE] border border-[#D5E2D9] space-y-4">
        <div className="flex items-center gap-2 text-[#1E3A2F]">
          <div className="w-8 h-8 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[#EBF2EE]" />
          </div>
          <h2 className="text-xl font-bold">AI Daily Care Brief (Google Gemini)</h2>
          <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white text-[#1E3A2F]">
            Cached at 06:00 AM
          </span>
        </div>

        <p className="text-base text-[#1E3A2F] leading-relaxed">
          &quot;Good morning Priya. Appaji took his morning Telmisartan dose on time at 08:35 AM. His next medication is Metformin with lunch at 1:30 PM. He has a cardiology checkup on Wednesday with Dr. Ramesh; remember to remind him to stay hydrated.&quot;
        </p>

        <div className="text-xs text-[#5C6460] pt-2 border-t border-[#D5E2D9] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#607B6E]" />
          <span>Strict Clinical Safety Guardrails: Summarizes verified database entries only. Zero medical diagnosing or prescription alterations.</span>
        </div>
      </div>

      {/* Today's Evaluated Timeline & Connected Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Medication Timeline */}
        <div className="lg:col-span-2 p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1E3A2F]">Today&apos;s Medication Timeline</h2>
              <p className="text-xs text-[#5C6460] mt-0.5">Sunday, 15 November • Evaluated in real-time</p>
            </div>
            <Link
              href="/dashboard/medications"
              className="text-xs font-bold text-[#1E3A2F] hover:text-[#162E25] flex items-center gap-1"
            >
              <span>Manage Schedules</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {timeline.length > 0 ? (
              timeline.map((dose, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    dose.status === "TAKEN"
                      ? "bg-[#FDFBF7] border-[#EFECE6]"
                      : dose.status === "DUE"
                      ? "bg-amber-50/40 border-amber-300"
                      : dose.status === "OVERDUE"
                      ? "bg-rose-50/40 border-rose-300"
                      : "bg-[#FDFBF7] border-[#EFECE6] opacity-85"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                        dose.status === "TAKEN"
                          ? "bg-emerald-100 text-emerald-800"
                          : dose.status === "OVERDUE"
                          ? "bg-rose-100 text-rose-800"
                          : dose.status === "DUE"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-[#EBF2EE] text-[#1E3A2F]"
                      }`}
                    >
                      {dose.status === "TAKEN" ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1E3A2F]">
                        {dose.medicationName} {dose.dosageStrength}
                      </h3>
                      <p className="text-xs text-[#5C6460]">
                        {dose.targetTime} • {dose.instructions}
                      </p>
                    </div>
                  </div>

                  <div>
                    {dose.status === "TAKEN" ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        TAKEN {dose.recordedAt ? `at ${new Date(dose.recordedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""} ({dose.actorRole === "CARETAKER" ? "by Caretaker Suresh" : "by Appaji"})
                      </span>
                    ) : dose.status === "OVERDUE" ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-800 font-bold border border-rose-200">
                        OVERDUE
                      </span>
                    ) : dose.status === "DUE" ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        DUE NOW
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-[#EBF2EE] text-[#5C6460] font-bold">
                        UPCOMING
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <>
                {/* Fallback Display if API is in preview mode */}
                <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1E3A2F]">Telmisartan 40mg</h3>
                      <p className="text-xs text-[#5C6460]">08:30 AM • After Breakfast</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                    TAKEN at 08:35 AM (by Appaji)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1E3A2F]">Metformin 500mg</h3>
                      <p className="text-xs text-[#5C6460]">01:30 PM • With Lunch</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                    UPCOMING
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] flex items-center justify-between opacity-80">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center font-bold">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#1E3A2F]">Metformin 500mg</h3>
                      <p className="text-xs text-[#5C6460]">08:30 PM • With Dinner</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#EBF2EE] text-[#5C6460] font-bold">
                    UPCOMING
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Connected Members & Notification Status */}
        <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#1E3A2F]">Connected Members</h2>
            <Link
              href="/dashboard/members"
              className="text-xs font-bold text-[#607B6E] hover:text-[#1E3A2F]"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#EFECE6] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#1E3A2F]">Priya Sharma</p>
                <p className="text-xs text-[#5C6460]">Family Admin (Daughter)</p>
              </div>
              <span className="text-xs font-semibold text-[#1E3A2F] bg-[#EBF2EE] px-2 py-0.5 rounded-full">Owner</span>
            </div>

            <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#EFECE6] flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-[#1E3A2F]">Suresh Kumar</p>
                <p className="text-xs text-[#5C6460]">Caretaker (Day Shift)</p>
              </div>
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">Active</span>
            </div>
          </div>

          <div className="pt-4 border-t border-[#EFECE6] space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
                Notification Channels:
              </h3>
              <Link
                href="/dashboard/settings/notifications"
                className="text-[11px] font-bold text-[#1E3A2F] hover:underline"
              >
                Configure
              </Link>
            </div>
            <div className="text-xs text-[#5C6460] space-y-1.5">
              <div className="flex items-center justify-between">
                <span>Telegram Bot:</span>
                <span className="font-semibold text-emerald-700">Connected (@VatsalyaCareBot)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Resend Email:</span>
                <span className="font-semibold text-emerald-700">Active (priya@example.com)</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Escalation Policy:</span>
                <span className="font-semibold text-[#1E3A2F]">30m Caretaker • 60m Family</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}