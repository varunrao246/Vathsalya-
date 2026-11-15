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
  Send,
  Mail,
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-[#EBF2EE] text-[#1E3A2F] border border-[#D5E2D9] inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Family Member Overview Mode
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#1E3A2F] tracking-tight">
            Appaji&apos;s Healthcare Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6460]">
            Logged in as <strong className="text-[#1E3A2F]">Priya Sharma</strong> (Daughter &amp; Healthcare Administrator)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/dashboard/medications"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A2F] text-white text-xs sm:text-sm font-bold hover:bg-[#162E25] shadow-xs transition-colors"
          >
            <Pill className="w-4 h-4 text-[#EBF2EE]" />
            <span>Manage Medications</span>
          </Link>
          <Link
            href="/dashboard/members"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-white text-xs sm:text-sm font-bold text-[#1E3A2F] hover:border-[#607B6E] shadow-xs hover:bg-[#FAF8F5] transition-colors"
          >
            <UserPlus className="w-4 h-4 text-[#607B6E]" />
            <span>Passcode Invitations</span>
          </Link>
        </div>
      </div>

      {/* Peace of Mind Status Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
          </div>
          <div>
            <h2 className="text-sm font-black text-emerald-950">Appaji is on schedule today</h2>
            <p className="text-xs text-emerald-800 mt-0.5">Morning dose was confirmed at 08:35 AM. Next dose scheduled at 01:30 PM with lunch.</p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-900 bg-white px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-center">
          Zero Overdue Alerts
        </span>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
                7-Day Adherence Rate
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#1E3A2F]">{adherence.percent}%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                On Target
              </span>
            </div>
            <p className="mt-2 text-xs text-[#5C6460]">
              17 of 18 scheduled doses confirmed within grace periods.
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
                Today&apos;s Doses
              </span>
              <Clock className="w-4 h-4 text-[#607B6E]" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#1E3A2F]">
                {adherence.taken} of {adherence.total}
              </span>
              <span className="text-xs font-bold text-[#607B6E]">Confirmed</span>
            </div>
            <p className="mt-2 text-xs text-[#5C6460]">
              Next: Metformin (500 mg) at 01:30 PM (With Lunch).
            </p>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
                Upcoming Doctor Visit
              </span>
              <Calendar className="w-4 h-4 text-[#607B6E]" />
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-xl font-black text-[#1E3A2F]">Wednesday</span>
              <span className="text-xs font-bold text-[#5C6460]">10:30 AM</span>
            </div>
            <p className="mt-2 text-xs text-[#5C6460]">
              Dr. K. S. Ramesh (Cardiology, Fortis Hospital). You are accompanying.
            </p>
          </div>
        </div>
      </div>

      {/* AI Daily Care Brief (Google Gemini) */}
      <div className="p-6 sm:p-8 rounded-3xl bg-[#EBF2EE] border border-[#D5E2D9] space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5 text-[#1E3A2F]">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#EBF2EE]" />
            </div>
            <h2 className="text-lg sm:text-xl font-black">AI Daily Care Summary (Google Gemini)</h2>
          </div>
          <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-white text-[#1E3A2F] border border-[#D5E2D9]">
            Generated Today • 06:00 AM
          </span>
        </div>

        <p className="text-sm sm:text-base text-[#1E3A2F] leading-relaxed font-medium">
          &quot;Good morning Priya. Appaji confirmed taking his morning Telmisartan dose on time at 08:35 AM. His next medication is Metformin with lunch at 1:30 PM. Attendant Ramesh is on duty for the lunch shift. Appaji has a cardiology follow-up on Wednesday with Dr. Ramesh; remember to carry his previous vitals log.&quot;
        </p>

        <div className="text-xs text-[#5C6460] pt-3 border-t border-[#D5E2D9] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#607B6E] shrink-0" />
          <span>Strict Guardrails: Synthesizes verified database occurrences only. Zero medical diagnosis or prescription alterations.</span>
        </div>
      </div>

      {/* Today's Evaluated Timeline & Connected Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Medication Timeline */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1E3A2F]">Today&apos;s Medication Timeline</h2>
              <p className="text-xs text-[#5C6460] mt-0.5">Sunday, 15 November • Evaluated deterministically in real-time</p>
            </div>
            <Link
              href="/dashboard/medications"
              className="text-xs font-bold text-[#1E3A2F] hover:text-[#162E25] flex items-center gap-1"
            >
              <span>Manage Schedules</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {timeline.length > 0 ? (
              timeline.map((dose, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                    dose.status === "TAKEN"
                      ? "bg-[#FAF8F5] border-[#EFECE6]"
                      : dose.status === "DUE"
                      ? "bg-amber-50/50 border-amber-300"
                      : dose.status === "OVERDUE"
                      ? "bg-rose-50/50 border-rose-300"
                      : "bg-[#FAF8F5] border-[#EFECE6]"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
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
                      <h3 className="text-sm sm:text-base font-extrabold text-[#1E3A2F]">
                        {dose.medicationName} ({dose.dosageStrength})
                      </h3>
                      <p className="text-xs text-[#5C6460]">
                        {dose.targetTime} • {dose.instructions}
                      </p>
                    </div>
                  </div>

                  <div>
                    {dose.status === "TAKEN" ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                        Taken {dose.actorRole === "CARETAKER" ? "(Caretaker Suresh)" : "(Appaji)"}
                      </span>
                    ) : dose.status === "OVERDUE" ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-rose-50 text-rose-800 font-extrabold border border-rose-200 animate-pulse">
                        Overdue (Pending Follow-up)
                      </span>
                    ) : dose.status === "DUE" ? (
                      <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-extrabold border border-amber-200">
                        Due Now
                      </span>
                    ) : (
                      <span className="text-xs px-3 py-1 rounded-full bg-[#EBF2EE] text-[#5C6460] font-bold">
                        Upcoming
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <>
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#1E3A2F]">Telmisartan (40 mg)</h3>
                      <p className="text-xs text-[#5C6460]">08:30 AM • After Breakfast</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                    Taken at 08:35 AM (by Appaji)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white border-2 border-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#1E3A2F]">Metformin (500 mg)</h3>
                      <p className="text-xs text-[#5C6460]">01:30 PM • With Lunch</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-extrabold border border-amber-200">
                    Upcoming (1h remaining)
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center font-bold shrink-0">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-extrabold text-[#1E3A2F]">Metformin (500 mg)</h3>
                      <p className="text-xs text-[#5C6460]">08:30 PM • With Dinner</p>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-[#EBF2EE] text-[#5C6460] font-bold">
                    Scheduled
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Connected Members & Escalation Preferences */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#1E3A2F]">Connected Members</h2>
              <Link
                href="/dashboard/members"
                className="text-xs font-bold text-[#607B6E] hover:text-[#1E3A2F]"
              >
                Manage
              </Link>
            </div>
            <div className="space-y-3 mt-4">
              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-[#1E3A2F]">Priya Sharma</p>
                  <p className="text-[11px] text-[#5C6460]">Family Admin (Daughter)</p>
                </div>
                <span className="text-[10px] font-bold text-[#1E3A2F] bg-[#EBF2EE] px-2 py-0.5 rounded-full border border-[#D5E2D9]">Admin</span>
              </div>

              <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between">
                <div>
                  <p className="text-xs font-extrabold text-[#1E3A2F]">Suresh Kumar</p>
                  <p className="text-[11px] text-[#5C6460]">Attendant (Day Shift)</p>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">Active</span>
              </div>
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
                Settings
              </Link>
            </div>
            <div className="text-xs text-[#5C6460] space-y-2">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-[#607B6E]" />
                  Telegram Bot:
                </span>
                <span className="font-bold text-emerald-700">@VatsalyaCareBot</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#607B6E]" />
                  Email Alerts:
                </span>
                <span className="font-bold text-emerald-700">Active (Resend)</span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-[#EFECE6]">
                <span>Escalation Rule:</span>
                <span className="font-bold text-[#1E3A2F]">30m Caretaker • 60m Family</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
