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
  RefreshCw,
  Plus,
  Activity,
  UserCheck,
} from "lucide-react";
import type { DoseOccurrence } from "@/lib/medications/dose-engine";

interface CareSummaryData {
  summaryText: string;
  adherenceRate: number;
  status: "OPTIMAL" | "ATTENTION_NEEDED" | "CRITICAL_ACTION_REQUIRED";
  keyObservations: string[];
  recommendations: string[];
  generatedAt: string;
  isFallback: boolean;
  modelUsed?: string;
}

interface AppointmentItem {
  id: string;
  doctor_name: string;
  specialty: string;
  clinic_name: string;
  location_or_link: string;
  appointment_time: string;
  status: string;
  notes?: string;
}

interface CareActivityItem {
  id: string;
  actor_role: string;
  action_type: string;
  action_payload: Record<string, unknown>;
  created_at: string;
}

export default function FamilyDashboard() {
  const [timeline, setTimeline] = useState<DoseOccurrence[]>([]);
  const [adherence, setAdherence] = useState({ total: 3, taken: 1, percent: 94 });
  const [careSummary, setCareSummary] = useState<CareSummaryData | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
  const [activities, setActivities] = useState<CareActivityItem[]>([]);
  const [showAddAppt, setShowAddAppt] = useState(false);
  const [apptDoctor, setApptDoctor] = useState("");
  const [apptSpecialty, setApptSpecialty] = useState("");
  const [apptClinic, setApptClinic] = useState("");
  const [apptTime, setApptTime] = useState("");
  const [submittingAppt, setSubmittingAppt] = useState(false);

  // Load baseline medication timeline
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

  // Load AI Care Summary
  const refreshCareSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/care-insights?healthcareProfileId=demo-profile-appaji&forceRefresh=true");
      const json = await res.json();
      if (json.success && json.data) {
        setCareSummary(json.data);
      }
    } catch {
      // Fallback preserved
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function fetchSummary() {
      try {
        const res = await fetch("/api/care-insights?healthcareProfileId=demo-profile-appaji");
        const json = await res.json();
        if (!ignore && json.success && json.data) {
          setCareSummary(json.data);
        }
      } catch {
        // Fallback
      }
    }
    fetchSummary();
    return () => {
      ignore = true;
    };
  }, []);

  // Load Upcoming Appointments
  const refreshAppointments = async () => {
    try {
      const res = await fetch("/api/appointments?healthcareProfileId=demo-profile-appaji&type=upcoming");
      const json = await res.json();
      if (json.success && json.data) {
        setAppointments(json.data);
      }
    } catch {
      // Fallback
    }
  };

  useEffect(() => {
    let ignore = false;
    async function fetchAppointments() {
      try {
        const res = await fetch("/api/appointments?healthcareProfileId=demo-profile-appaji&type=upcoming");
        const json = await res.json();
        if (!ignore && json.success && json.data) {
          setAppointments(json.data);
        }
      } catch {
        // Fallback
      }
    }
    fetchAppointments();
    return () => {
      ignore = true;
    };
  }, []);

  // Load Care Activities
  useEffect(() => {
    async function loadActivities() {
      try {
        const res = await fetch("/api/care-activities?healthcareProfileId=demo-profile-appaji&limit=8");
        const json = await res.json();
        if (json.success && json.data) {
          setActivities(json.data);
        }
      } catch {
        // Fallback
      }
    }
    loadActivities();
  }, []);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apptDoctor || !apptSpecialty || !apptClinic || !apptTime) return;

    setSubmittingAppt(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthcareProfileId: "demo-profile-appaji",
          doctorName: apptDoctor,
          specialty: apptSpecialty,
          clinicName: apptClinic,
          locationOrLink: apptClinic,
          appointmentTime: new Date(apptTime).toISOString(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        setShowAddAppt(false);
        setApptDoctor("");
        setApptSpecialty("");
        setApptClinic("");
        setApptTime("");
        refreshAppointments();
      }
    } catch {
      //
    } finally {
      setSubmittingAppt(false);
    }
  };

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
            <p className="text-xs text-emerald-800 mt-0.5">Morning dose was confirmed on time. Attendant Ramesh is on duty.</p>
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
                7-Day Adherence
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-black text-[#1E3A2F]">{adherence.percent}%</span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                +2% vs last week
              </span>
            </div>
            <p className="mt-2 text-xs text-[#5C6460]">
              Consistently taking morning blood pressure dose on time.
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
            {appointments.length > 0 ? (
              <div className="mt-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-black text-[#1E3A2F]">
                    {new Date(appointments[0].appointment_time).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}
                  </span>
                  <span className="text-xs font-bold text-[#5C6460]">
                    {new Date(appointments[0].appointment_time).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[#5C6460]">
                  {appointments[0].doctor_name} ({appointments[0].specialty}) at {appointments[0].clinic_name}
                </p>
              </div>
            ) : (
              <div className="mt-3">
                <span className="text-lg font-black text-[#1E3A2F]">Wednesday 10:30 AM</span>
                <p className="mt-1 text-xs text-[#5C6460]">
                  Dr. K. S. Ramesh (Cardiology, Fortis Hospital).
                </p>
              </div>
            )}
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
            <div>
              <h2 className="text-lg sm:text-xl font-black">AI Daily Care Summary (Google Gemini)</h2>
              <p className="text-[11px] text-[#5C6460]">
                {careSummary?.modelUsed ? `Powered by ${careSummary.modelUsed}` : "Grounded geriatric care intelligence"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshCareSummary}
              disabled={loadingSummary}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-xs font-bold text-[#1E3A2F] border border-[#D5E2D9] hover:bg-[#FAF8F5] transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#607B6E] ${loadingSummary ? "animate-spin" : ""}`} />
              <span>{loadingSummary ? "Synthesizing..." : "Refresh Summary"}</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white text-[#1E3A2F] border border-[#D5E2D9]">
              {careSummary?.status === "CRITICAL_ACTION_REQUIRED"
                ? "Attention Needed"
                : "All Stable"}
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#1E3A2F] leading-relaxed font-medium">
          {careSummary?.summaryText ||
            "Appaji is maintaining excellent consistency today. Morning blood pressure medication was confirmed promptly. Attendant Ramesh is on duty for the afternoon shift. All upcoming care appointments and medication routines remain fully on schedule."}
        </p>

        {careSummary?.keyObservations && careSummary.keyObservations.length > 0 && (
          <div className="mt-3 space-y-1.5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#607B6E]">Key Observations:</p>
            <ul className="text-xs text-[#1E3A2F] space-y-1 list-disc list-inside">
              {careSummary.keyObservations.map((obs, i) => (
                <li key={i}>{obs}</li>
              ))}
            </ul>
          </div>
        )}

        {careSummary?.recommendations && careSummary.recommendations.length > 0 && (
          <div className="mt-2 space-y-1.5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#607B6E]">Caregiver Action Items:</p>
            <ul className="text-xs text-[#1E3A2F] space-y-1 list-disc list-inside">
              {careSummary.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-xs text-[#5C6460] pt-3 border-t border-[#D5E2D9] flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#607B6E] shrink-0" />
          <span>Strict Guardrails: Synthesizes verified database occurrences only. Zero medical diagnosis or prescription alterations.</span>
        </div>
      </div>

      {/* Medication Timeline & Upcoming Appointments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Medication Timeline */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1E3A2F]">Today&apos;s Medication Timeline</h2>
              <p className="text-xs text-[#5C6460] mt-0.5">Evaluated deterministically in profile timezone</p>
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
              <div className="p-8 text-center text-[#5C6460] bg-[#FAF8F5] rounded-2xl border border-[#EFECE6]">
                <Pill className="w-8 h-8 text-[#607B6E] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#1E3A2F]">No medication occurrences evaluated yet</p>
                <p className="text-xs mt-1">Configure active medication schedules to generate daily occurrences.</p>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Appointments & Schedule Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#1E3A2F]">Clinical Visits</h2>
              <button
                onClick={() => setShowAddAppt(!showAddAppt)}
                className="text-xs font-bold text-[#1E3A2F] hover:text-[#162E25] flex items-center gap-1 bg-[#EBF2EE] px-2.5 py-1 rounded-lg border border-[#D5E2D9]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddAppt ? "Close" : "Schedule"}</span>
              </button>
            </div>

            {showAddAppt && (
              <form onSubmit={handleCreateAppointment} className="mt-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] space-y-3">
                <p className="text-xs font-bold text-[#1E3A2F]">New Doctor Appointment</p>
                <input
                  type="text"
                  placeholder="Doctor Name (e.g. Dr. Ananth Kumar)"
                  value={apptDoctor}
                  onChange={(e) => setApptDoctor(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#D5E2D9] bg-white text-[#1E3A2F]"
                  required
                />
                <input
                  type="text"
                  placeholder="Specialty (e.g. Cardiology, Orthopedics)"
                  value={apptSpecialty}
                  onChange={(e) => setApptSpecialty(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#D5E2D9] bg-white text-[#1E3A2F]"
                  required
                />
                <input
                  type="text"
                  placeholder="Hospital / Clinic (e.g. Manipal Hospital)"
                  value={apptClinic}
                  onChange={(e) => setApptClinic(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#D5E2D9] bg-white text-[#1E3A2F]"
                  required
                />
                <input
                  type="datetime-local"
                  value={apptTime}
                  onChange={(e) => setApptTime(e.target.value)}
                  className="w-full text-xs p-2 rounded-xl border border-[#D5E2D9] bg-white text-[#1E3A2F]"
                  required
                />
                <button
                  type="submit"
                  disabled={submittingAppt}
                  className="w-full py-2 bg-[#1E3A2F] text-white text-xs font-bold rounded-xl hover:bg-[#162E25] disabled:opacity-50"
                >
                  {submittingAppt ? "Saving..." : "Save Appointment"}
                </button>
              </form>
            )}

            <div className="space-y-3 mt-4">
              {appointments.length > 0 ? (
                appointments.map((a) => (
                  <div key={a.id} className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-extrabold text-[#1E3A2F]">{a.doctor_name}</p>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        {a.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5C6460]">{a.specialty} • {a.clinic_name}</p>
                    <p className="text-[11px] text-[#1E3A2F] font-bold">
                      {new Date(a.appointment_time).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-[#5C6460] bg-[#FAF8F5] rounded-xl border border-[#EFECE6]">
                  No upcoming clinical visits scheduled. Click &quot;Schedule&quot; above to add one.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-[#EFECE6] space-y-2">
            <h3 className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
              Connected Healthcare Circle
            </h3>
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
            </div>
          </div>
        </div>
      </div>

      {/* Shared Care History / Activity Timeline */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] text-[#1E3A2F] flex items-center justify-center">
              <Activity className="w-4 h-4 text-[#1E3A2F]" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1E3A2F]">Shared Care History &amp; Audit Trail</h2>
              <p className="text-xs text-[#5C6460]">Immutable record of all confirmed doses, caretaker follow-ups, and clinical visits</p>
            </div>
          </div>
          <span className="text-xs font-bold text-[#607B6E] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#EFECE6]">
            Live Verified Logs
          </span>
        </div>

        <div className="space-y-3">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div key={act.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white border border-[#D5E2D9] flex items-center justify-center text-[#1E3A2F]">
                    <UserCheck className="w-4 h-4 text-[#607B6E]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#1E3A2F]">
                      {act.action_type.replace(/_/g, " ")}
                    </p>
                    <p className="text-[11px] text-[#5C6460]">
                      Role: <strong className="text-[#1E3A2F]">{act.actor_role}</strong> • {new Date(act.created_at).toLocaleString("en-IN", {
                        dateStyle: "short",
                        timeStyle: "short",
                      })}
                    </p>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-[#5C6460] bg-white px-2.5 py-1 rounded-md border border-[#EFECE6]">
                  {JSON.stringify(act.action_payload).slice(0, 40)}...
                </span>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-xs text-[#5C6460] bg-[#FAF8F5] rounded-xl border border-[#EFECE6]">
              Audit trail initialized. Verified actions from elderly confirmations, caretaker escalations, and appointments will log here automatically.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
