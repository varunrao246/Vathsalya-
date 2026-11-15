"use client";

import { useState, useEffect, useCallback } from "react";
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
  RefreshCw,
  Plus,
  Activity,
  HeartHandshake,
  Loader2,
} from "lucide-react";
import type { DoseOccurrence } from "@/lib/medications/dose-engine";
import { useDashboard, formatUserBadge } from "@/context/DashboardContext";

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
  const { user, activeProfile, isDemo, loading: dashboardLoading } = useDashboard();

  const [timeline, setTimeline] = useState<DoseOccurrence[]>([]);
  const [adherence, setAdherence] = useState({ total: 0, taken: 0, percent: 100 });
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
  const [loadingData, setLoadingData] = useState(false);

  // Load baseline medication timeline for the active profile
  const loadMedicationTimeline = useCallback(async (profileId: string) => {
    try {
      const res = await fetch(`/api/doses/today?healthcareProfileId=${profileId}`);
      const json = await res.json();
      if (json.success && json.data?.timeline) {
        setTimeline(json.data.timeline);
        if (json.data.summary) {
          setAdherence({
            total: json.data.summary.total,
            taken: json.data.summary.taken,
            percent: json.data.summary.adherencePercentage,
          });
        }
      } else {
        setTimeline([]);
        setAdherence({ total: 0, taken: 0, percent: 100 });
      }
    } catch {
      setTimeline([]);
    }
  }, []);

  // Load AI Care Summary
  const refreshCareSummary = useCallback(async () => {
    if (!activeProfile) return;
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/care-insights?healthcareProfileId=${activeProfile.id}&forceRefresh=true`);
      const json = await res.json();
      if (json.success && json.data) {
        setCareSummary(json.data);
      }
    } catch {
      //
    } finally {
      setLoadingSummary(false);
    }
  }, [activeProfile]);

  // Load Upcoming Appointments
  const loadAppointments = useCallback(async (profileId: string) => {
    try {
      const res = await fetch(`/api/appointments?healthcareProfileId=${profileId}&type=upcoming`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setAppointments(json.data);
      } else {
        setAppointments([]);
      }
    } catch {
      setAppointments([]);
    }
  }, []);

  // Load Care Activities
  const loadActivities = useCallback(async (profileId: string) => {
    try {
      const res = await fetch(`/api/care-activities?healthcareProfileId=${profileId}&limit=8`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setActivities(json.data);
      } else {
        setActivities([]);
      }
    } catch {
      setActivities([]);
    }
  }, []);

  // Fetch all profile-dependent data whenever the active profile changes
  useEffect(() => {
    if (!activeProfile) {
      setTimeline([]);
      setCareSummary(null);
      setAppointments([]);
      setActivities([]);
      return;
    }

    setLoadingData(true);
    Promise.all([
      loadMedicationTimeline(activeProfile.id),
      loadAppointments(activeProfile.id),
      loadActivities(activeProfile.id),
      fetch(`/api/care-insights?healthcareProfileId=${activeProfile.id}`)
        .then((r) => r.json())
        .then((json) => {
          if (json.success && json.data) {
            setCareSummary(json.data);
          }
        })
        .catch(() => {}),
    ]).finally(() => {
      setLoadingData(false);
    });
  }, [activeProfile, loadMedicationTimeline, loadAppointments, loadActivities]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProfile || !apptDoctor || !apptSpecialty || !apptClinic || !apptTime) return;

    setSubmittingAppt(true);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthcareProfileId: activeProfile.id,
          doctorName: apptDoctor.trim(),
          specialty: apptSpecialty.trim(),
          clinicName: apptClinic.trim(),
          locationOrLink: apptClinic.trim(),
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
        loadAppointments(activeProfile.id);
      }
    } catch {
      //
    } finally {
      setSubmittingAppt(false);
    }
  };

  // 1. Loading state
  if (dashboardLoading || (loadingData && !activeProfile)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#1E3A2F] animate-spin" />
        <p className="text-sm font-bold text-[#5C6460]">Loading your healthcare dashboard...</p>
      </div>
    );
  }

  // 2. Empty State: Authenticated user without any healthcare profiles
  if (!activeProfile && !isDemo) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center mx-auto shadow-xs">
          <HeartHandshake className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A2F]">
            Welcome, {user?.fullName || "Family Caregiver"}!
          </h1>
          <p className="text-sm text-[#5C6460] max-w-lg mx-auto">
            You do not have any healthcare profiles linked to your account yet. Create your first profile to begin managing medications, appointments, and proactive care for your loved one.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto pt-4 text-left">
          <Link
            href="/onboard"
            className="p-5 rounded-2xl bg-white border border-[#EFECE6] hover:border-[#1E3A2F] shadow-xs hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Plus className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-extrabold text-[#1E3A2F]">Create Healthcare Profile</h3>
            <p className="text-xs text-[#5C6460] mt-1">Set up a clinical profile for an elderly parent or family member.</p>
          </Link>

          <Link
            href="/join"
            className="p-5 rounded-2xl bg-white border border-[#EFECE6] hover:border-[#1E3A2F] shadow-xs hover:shadow-sm transition-all group"
          >
            <div className="w-9 h-9 rounded-xl bg-[#FAF8F5] text-[#1E3A2F] border border-[#EFECE6] flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <UserPlus className="w-5 h-5 text-[#607B6E]" />
            </div>
            <h3 className="text-sm font-extrabold text-[#1E3A2F]">Redeem Passcode</h3>
            <p className="text-xs text-[#5C6460] mt-1">Join an existing family profile with a 6-digit access code.</p>
          </Link>
        </div>
      </div>
    );
  }

  const patientName = activeProfile?.displayName || "Healthcare";
  const userRoleString = formatUserBadge(user?.fullName || "Your Account", activeProfile?.relationship, activeProfile?.role);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Context with Dynamic Patient & User Names */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-[#EBF2EE] text-[#1E3A2F] border border-[#D5E2D9] inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Family Member Overview Mode
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#1E3A2F] tracking-tight">
            {patientName}&apos;s Healthcare Overview
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6460]">
            Logged in as <strong className="text-[#1E3A2F]">{userRoleString}</strong>
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
            <h2 className="text-sm font-black text-emerald-950">
              {patientName} Care Status
            </h2>
            <p className="text-xs text-emerald-800 mt-0.5">
              {timeline.some((d) => d.status === "TAKEN")
                ? "Doses for today are actively tracked and confirmed on schedule."
                : "Active medication and daily appointment schedules are synchronized."}
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-emerald-900 bg-white px-3 py-1 rounded-full border border-emerald-200 self-start sm:self-center">
          {adherence.total > 0 ? `${adherence.percent}% Adherence` : "Active Profile"}
        </span>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#5C6460]">
            <span className="text-xs font-bold uppercase tracking-wider">Today&apos;s Adherence</span>
            <Activity className="w-4 h-4 text-[#607B6E]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1E3A2F]">{adherence.percent}%</span>
            <span className="text-xs text-[#5C6460]">({adherence.taken}/{adherence.total} Doses)</span>
          </div>
          <p className="text-xs text-[#5C6460]">
            {adherence.total > 0 ? "Evaluated in profile timezone" : "No scheduled doses today"}
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#5C6460]">
            <span className="text-xs font-bold uppercase tracking-wider">Scheduled Today</span>
            <Pill className="w-4 h-4 text-[#607B6E]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1E3A2F]">{timeline.length}</span>
            <span className="text-xs text-[#5C6460]">Occurrences</span>
          </div>
          <p className="text-xs text-[#5C6460]">
            {timeline.filter((d) => d.status === "DUE").length} Due Now • {timeline.filter((d) => d.status === "UPCOMING").length} Upcoming
          </p>
        </div>

        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-[#5C6460]">
            <span className="text-xs font-bold uppercase tracking-wider">Care Appointments</span>
            <Calendar className="w-4 h-4 text-[#607B6E]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-[#1E3A2F]">{appointments.length}</span>
            <span className="text-xs text-[#5C6460]">Upcoming</span>
          </div>
          <p className="text-xs text-[#5C6460]">
            {appointments.length > 0 ? `Next: Dr. ${appointments[0].doctor_name}` : "No pending visits"}
          </p>
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-xs font-bold text-[#1E3A2F] border border-[#D5E2D9] hover:bg-[#FAF8F5] transition-colors disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#607B6E] ${loadingSummary ? "animate-spin" : ""}`} />
              <span>{loadingSummary ? "Synthesizing..." : "Refresh Summary"}</span>
            </button>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-white text-[#1E3A2F] border border-[#D5E2D9]">
              {careSummary?.status === "CRITICAL_ACTION_REQUIRED" ? "Attention Needed" : "All Stable"}
            </span>
          </div>
        </div>

        <p className="text-sm sm:text-base text-[#1E3A2F] leading-relaxed font-medium">
          {careSummary?.summaryText ||
            (isDemo
              ? "Appaji is maintaining excellent consistency today. Morning blood pressure medication was confirmed promptly. Attendant Ramesh is on duty for the afternoon shift. All upcoming care appointments and medication routines remain fully on schedule."
              : `Clinical care summary for ${patientName} is synchronized with confirmed occurrences. All upcoming care appointments and medication routines remain fully on schedule.`)}
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
              <p className="text-xs text-[#5C6460] mt-0.5">Evaluated deterministically in profile timezone ({activeProfile?.timezone || "Asia/Kolkata"})</p>
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
                      ? "bg-emerald-50/50 border-emerald-200"
                      : dose.status === "OVERDUE"
                      ? "bg-rose-50/50 border-rose-200"
                      : dose.status === "DUE"
                      ? "bg-amber-50/50 border-amber-200"
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
                        Taken {dose.actorRole ? `(${dose.actorRole})` : `(${patientName})`}
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
                <p className="text-sm font-bold text-[#1E3A2F]">No medication occurrences scheduled for today</p>
                <p className="text-xs mt-1 text-[#5C6460]">
                  Configure medication schedules for {patientName} to track daily doses.
                </p>
                <Link
                  href="/dashboard/medications"
                  className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1E3A2F] text-white text-xs font-bold hover:bg-[#162E25] transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Schedule</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Clinical Appointments & Schedule Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-black text-[#1E3A2F]">Upcoming Appointments</h2>
                <p className="text-xs text-[#5C6460]">Doctor checkups &amp; diagnostics</p>
              </div>
              <button
                onClick={() => setShowAddAppt(!showAddAppt)}
                className="p-1.5 rounded-lg border border-[#EFECE6] bg-[#FAF8F5] hover:bg-white text-[#1E3A2F] transition-colors cursor-pointer"
                title="Schedule Appointment"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Add Form Modal/Drawer */}
            {showAddAppt && (
              <form onSubmit={handleCreateAppointment} className="mb-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] space-y-3">
                <h4 className="text-xs font-black text-[#1E3A2F]">Schedule Doctor Appointment</h4>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#5C6460] mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={apptDoctor}
                    onChange={(e) => setApptDoctor(e.target.value)}
                    placeholder="e.g. Dr. Ramesh"
                    className="w-full text-xs p-2 rounded-lg border border-[#EFECE6] bg-white text-[#1E3A2F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#5C6460] mb-1">Specialty</label>
                  <input
                    type="text"
                    required
                    value={apptSpecialty}
                    onChange={(e) => setApptSpecialty(e.target.value)}
                    placeholder="e.g. Geriatric Cardiology"
                    className="w-full text-xs p-2 rounded-lg border border-[#EFECE6] bg-white text-[#1E3A2F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#5C6460] mb-1">Clinic / Hospital</label>
                  <input
                    type="text"
                    required
                    value={apptClinic}
                    onChange={(e) => setApptClinic(e.target.value)}
                    placeholder="e.g. Manipal Hospital, Bangalore"
                    className="w-full text-xs p-2 rounded-lg border border-[#EFECE6] bg-white text-[#1E3A2F]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-[#5C6460] mb-1">Date &amp; Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={apptTime}
                    onChange={(e) => setApptTime(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-[#EFECE6] bg-white text-[#1E3A2F]"
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={submittingAppt}
                    className="flex-1 py-1.5 bg-[#1E3A2F] text-white rounded-lg text-xs font-bold hover:bg-[#162E25] disabled:opacity-50 cursor-pointer"
                  >
                    {submittingAppt ? "Saving..." : "Save Appointment"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAppt(false)}
                    className="px-3 py-1.5 border border-[#EFECE6] bg-white rounded-lg text-xs font-bold text-[#5C6460] cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {appointments.length > 0 ? (
                appointments.map((appt) => (
                  <div key={appt.id} className="p-3.5 rounded-2xl border border-[#EFECE6] bg-[#FAF8F5] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
                        {appt.specialty}
                      </span>
                      <span className="text-xs text-[#5C6460] font-medium">
                        {new Date(appt.appointment_time).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                        })}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-[#1E3A2F]">Dr. {appt.doctor_name}</h4>
                    <p className="text-[11px] text-[#5C6460]">{appt.clinic_name}</p>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-[#5C6460] bg-[#FAF8F5] rounded-2xl border border-[#EFECE6]">
                  <Calendar className="w-6 h-6 text-[#607B6E] mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-[#1E3A2F]">No upcoming appointments</p>
                  <p className="text-[11px] mt-0.5">Click + above to log a clinical visit.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Audit Log / Collaborative Care Feed */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-[#607B6E]" />
            <h2 className="text-base sm:text-lg font-black text-[#1E3A2F]">Collaborative Care Activity Stream</h2>
          </div>
          <span className="text-xs text-[#5C6460]">Immutable care audit</span>
        </div>

        <div className="space-y-2">
          {activities.length > 0 ? (
            activities.map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="px-2 py-0.5 rounded-md bg-[#EBF2EE] text-[#1E3A2F] font-bold text-[10px]">
                    {act.actor_role}
                  </span>
                  <span className="font-extrabold text-[#1E3A2F]">{act.action_type.replace(/_/g, " ")}</span>
                </div>
                <span className="text-[11px] text-[#5C6460]">
                  {new Date(act.created_at).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-[#5C6460] text-xs">
              No recent collaborative care activities recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
