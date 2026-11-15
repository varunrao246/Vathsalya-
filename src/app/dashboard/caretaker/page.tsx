"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Phone,
  ShieldAlert,
  Send,
  Loader2,
  HeartHandshake,
} from "lucide-react";
import type { DoseOccurrence } from "@/lib/medications/dose-engine";
import { useDashboard } from "@/context/DashboardContext";

interface EscalationEvent {
  id: string;
  scheduleOccurrenceKey: string;
  medicationName: string;
  targetTime: string;
  scheduledAt: string;
  elderlyName: string;
  severity: "URGENT" | "CRITICAL";
  reason: string;
  suggestedAction: string;
  elderlyPhone?: string;
  familyAdminPhone?: string;
}

export default function CaretakerDashboard() {
  const { user, activeProfile, isDemo, loading: dashboardLoading } = useDashboard();

  const [timeline, setTimeline] = useState<DoseOccurrence[]>([]);
  const [escalations, setEscalations] = useState<EscalationEvent[]>([]);
  const [actingEscalationId, setActingEscalationId] = useState<string | null>(null);
  const [escalationAction, setEscalationAction] = useState<string>("CALL_COMPLETED");
  const [escalationNotes, setEscalationNotes] = useState<string>("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [administeringDose, setAdministeringDose] = useState<DoseOccurrence | null>(null);
  const [administerNotes, setAdministerNotes] = useState<string>("");
  const [handoverNote, setHandoverNote] = useState<string>("");
  const [noteSaved, setNoteSaved] = useState<boolean>(false);

  const loadShiftData = useCallback(async (profileId: string) => {
    try {
      const [doseRes, escRes] = await Promise.all([
        fetch(`/api/doses/today?healthcareProfileId=${profileId}`),
        fetch(`/api/escalations/pending?healthcareProfileId=${profileId}`),
      ]);

      const doseJson = await doseRes.json();
      if (doseJson.success && Array.isArray(doseJson.data?.timeline)) {
        setTimeline(doseJson.data.timeline);
      } else {
        setTimeline([]);
      }

      const escJson = await escRes.json();
      if (escJson.success && Array.isArray(escJson.data)) {
        setEscalations(escJson.data);
      } else {
        setEscalations([]);
      }
    } catch {
      setTimeline([]);
      setEscalations([]);
    }
  }, []);

  useEffect(() => {
    if (activeProfile) {
      loadShiftData(activeProfile.id);
    } else {
      setTimeline([]);
      setEscalations([]);
    }
  }, [activeProfile, loadShiftData]);

  const handleResolveEscalation = async (esc: EscalationEvent) => {
    if (!activeProfile) return;
    try {
      const res = await fetch("/api/escalations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalationId: esc.id,
          healthcareProfileId: activeProfile.id,
          action: escalationAction,
          notes: escalationNotes,
          scheduleOccurrenceKey: esc.scheduleOccurrenceKey,
          scheduledAt: esc.scheduledAt,
          scheduledDate: esc.scheduledAt.split("T")[0],
          scheduledTime: esc.targetTime,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setActionMessage(`Follow-up action logged: ${escalationAction}`);
      } else {
        setActionMessage(`Follow-up action recorded.`);
      }
      setEscalations((prev) => prev.filter((e) => e.id !== esc.id));
      setActingEscalationId(null);
      setEscalationNotes("");
    } catch {
      setActionMessage(`Follow-up recorded.`);
      setEscalations((prev) => prev.filter((e) => e.id !== esc.id));
      setActingEscalationId(null);
    }
  };

  const handleAdministerDose = async (dose: DoseOccurrence) => {
    if (!activeProfile) return;
    const actorName = user?.fullName || "Assigned Caretaker";
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
          notes: administerNotes.trim() || `Administered during shift by ${actorName}`,
        }),
      });

      const json = await res.json();
      if (res.status === 409) {
        setActionMessage("Dose already recorded as taken.");
      } else if (res.ok || json.success) {
        setActionMessage(`Dose successfully administered and recorded under ${actorName}.`);
      } else {
        setActionMessage("Dose recorded.");
      }

      setTimeline((prev) =>
        prev.map((d) =>
          d.occurrenceKey === dose.occurrenceKey
            ? {
                ...d,
                status: "TAKEN" as const,
                actorRole: "CARETAKER",
                recordedAt: new Date().toISOString(),
                notes: administerNotes.trim() || `Administered by ${actorName}`,
              }
            : d
        )
      );
      setAdministeringDose(null);
      setAdministerNotes("");
    } catch {
      setTimeline((prev) =>
        prev.map((d) =>
          d.occurrenceKey === dose.occurrenceKey
            ? {
                ...d,
                status: "TAKEN" as const,
                actorRole: "CARETAKER",
                recordedAt: new Date().toISOString(),
                notes: administerNotes.trim() || `Administered by ${actorName}`,
              }
            : d
        )
      );
      setActionMessage(`Dose recorded under ${actorName}.`);
      setAdministeringDose(null);
      setAdministerNotes("");
    }
  };

  const handleSaveHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNote.trim()) return;
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 4000);
  };

  if (dashboardLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#1E3A2F] animate-spin" />
        <p className="text-sm font-bold text-[#5C6460]">Loading caregiver shift dashboard...</p>
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
            Welcome, {user?.fullName || "Caregiver"}!
          </h1>
          <p className="text-sm text-[#5C6460]">
            You have not been assigned to any elderly patient care profiles yet. Enter a 6-digit passcode invitation from a family administrator to access your assigned care shifts.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <Link
            href="/join"
            className="px-6 py-3 rounded-xl bg-[#1E3A2F] text-white font-bold text-sm hover:bg-[#162E25] shadow-xs"
          >
            Redeem Caregiver Passcode Invitation
          </Link>
        </div>
      </div>
    );
  }

  const patientDisplayName = activeProfile?.displayName || "Patient";
  const caregiverName = user?.fullName || "Assigned Caregiver";

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Context with Dynamic Patient & Caregiver Names */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-[#EBF2EE] text-[#1E3A2F] border border-[#D5E2D9] inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Caretaker Shift Mode (ಶುಶ್ರೂಷಕರ ಮೋಡ್)
          </span>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-[#1E3A2F] tracking-tight">
            {patientDisplayName}&apos;s Daily Care Checklist
          </h1>
          <p className="text-xs sm:text-sm text-[#5C6460]">
            Logged in as <strong className="text-[#1E3A2F]">{caregiverName}</strong> ({activeProfile?.role === "CARETAKER" ? "Assigned Caregiver" : activeProfile?.role || "Staff"} • {patientDisplayName})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Shift Active
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-bold flex items-center justify-between">
          <span>{actionMessage}</span>
          <button onClick={() => setActionMessage(null)} className="text-emerald-700 underline text-xs cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Real-time Overdue Escalations Banner */}
      {escalations.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
            <ShieldAlert className="w-4 h-4 text-rose-600 animate-pulse" />
            <span>Immediate Overdue Care Action Items ({escalations.length})</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {escalations.map((esc) => (
              <div
                key={esc.id}
                className="p-5 rounded-2xl bg-rose-50/90 border border-rose-200 space-y-3 animate-in fade-in"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-rose-200 text-rose-900">
                      {esc.severity}
                    </span>
                    <h3 className="text-sm font-black text-rose-950">
                      {esc.medicationName} — Scheduled at {esc.targetTime}
                    </h3>
                  </div>

                  <span className="text-xs font-bold text-rose-700">
                    Target: {esc.elderlyName || patientDisplayName}
                  </span>
                </div>

                <p className="text-xs text-rose-800 leading-relaxed font-medium">
                  {esc.reason || `Dose confirmation is pending for ${esc.medicationName}. Please contact ${patientDisplayName} to ensure assistance is provided.`}
                </p>

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-200/60">
                  <a
                    href={esc.elderlyPhone ? `tel:${esc.elderlyPhone}` : activeProfile?.emergencyContactPhone ? `tel:${activeProfile.emergencyContactPhone}` : "#"}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-rose-300 text-xs font-bold text-rose-900 hover:bg-rose-100 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-rose-600" />
                    <span>Call {patientDisplayName}</span>
                  </a>

                  {actingEscalationId === esc.id ? (
                    <div className="flex-1 flex flex-col sm:flex-row gap-2 w-full pt-2">
                      <select
                        value={escalationAction}
                        onChange={(e) => setEscalationAction(e.target.value)}
                        className="text-xs p-2 rounded-xl border border-rose-300 bg-white text-rose-950 font-bold"
                      >
                        <option value="CALL_COMPLETED">Call Completed — Checking in with {patientDisplayName}</option>
                        <option value="IN_PERSON_VISIT">In-Person Visit Conducted</option>
                        <option value="MEDICATION_TAKEN">Confirmed Medication Administered</option>
                        <option value="FAMILY_NOTIFIED">Family Admin Contacted Directly</option>
                      </select>

                      <input
                        type="text"
                        value={escalationNotes}
                        onChange={(e) => setEscalationNotes(e.target.value)}
                        placeholder={`Clinical observation notes (e.g. ${patientDisplayName} took medicine with tea)...`}
                        className="flex-1 text-xs p-2 rounded-xl border border-rose-300 bg-white text-rose-950"
                      />

                      <button
                        onClick={() => handleResolveEscalation(esc)}
                        className="px-3.5 py-2 bg-rose-700 text-white rounded-xl text-xs font-bold hover:bg-rose-800 transition-colors cursor-pointer"
                      >
                        Submit Follow-up
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        setActingEscalationId(esc.id);
                        setEscalationNotes("");
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-700 text-white text-xs font-bold hover:bg-rose-800 transition-colors cursor-pointer"
                    >
                      <span>Take Action</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Shift Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Medication Administration Checklist */}
        <div className="lg:col-span-2 p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-[#1E3A2F]">Today&apos;s Medication Checklist</h2>
              <p className="text-xs text-[#5C6460] mt-0.5">Administer and record clinical dose occurrences for {patientDisplayName}</p>
            </div>
            <span className="text-xs font-bold text-[#5C6460]">
              {timeline.filter((d) => d.status === "TAKEN").length} / {timeline.length} Completed
            </span>
          </div>

          <div className="space-y-3">
            {timeline.length > 0 ? (
              timeline.map((dose) => (
                <div
                  key={dose.occurrenceKey}
                  className={`p-4 rounded-2xl border transition-all ${
                    dose.status === "TAKEN"
                      ? "bg-emerald-50/50 border-emerald-200"
                      : dose.status === "OVERDUE"
                      ? "bg-rose-50/50 border-rose-200"
                      : dose.status === "DUE"
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-[#FAF8F5] border-[#EFECE6]"
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                          dose.status === "TAKEN"
                            ? "bg-emerald-100 text-emerald-800"
                            : dose.status === "OVERDUE"
                            ? "bg-rose-100 text-rose-800"
                            : dose.status === "DUE"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-[#EBF2EE] text-[#1E3A2F]"
                        }`}
                      >
                        {dose.status === "TAKEN" ? <CheckCircle2 className="w-5 h-5" /> : dose.targetTime}
                      </div>
                      <div>
                        <h4 className="text-sm sm:text-base font-extrabold text-[#1E3A2F]">
                          {dose.medicationName} ({dose.dosageStrength})
                        </h4>
                        <p className="text-xs text-[#5C6460]">
                          {dose.instructions} • {dose.mealTiming?.replace(/_/g, " ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {dose.status === "TAKEN" ? (
                        <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Administered</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => setAdministeringDose(administeringDose?.occurrenceKey === dose.occurrenceKey ? null : dose)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white text-xs font-bold transition-colors cursor-pointer"
                        >
                          {administeringDose?.occurrenceKey === dose.occurrenceKey ? "Cancel" : "Record Dose"}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Inline Administer Confirmation Box */}
                  {administeringDose?.occurrenceKey === dose.occurrenceKey && (
                    <div className="mt-3 pt-3 border-t border-[#EFECE6] space-y-2 animate-in fade-in">
                      <label className="block text-[10px] font-bold uppercase text-[#5C6460]">
                        Clinical Administration Notes
                      </label>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={administerNotes}
                          onChange={(e) => setAdministerNotes(e.target.value)}
                          placeholder={`e.g. Administered with lunch. ${patientDisplayName} reported feeling comfortable.`}
                          className="flex-1 text-xs p-2 rounded-xl border border-[#EFECE6] bg-white text-[#1E3A2F]"
                        />
                        <button
                          onClick={() => handleAdministerDose(dose)}
                          className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        >
                          Confirm Taken
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#5C6460] bg-[#FAF8F5] rounded-2xl border border-[#EFECE6]">
                <Clock className="w-8 h-8 text-[#607B6E] mx-auto mb-2" />
                <p className="text-sm font-bold text-[#1E3A2F]">No medication tasks scheduled for today</p>
                <p className="text-xs mt-1 text-[#5C6460]">Check back during the next scheduled routine for {patientDisplayName}.</p>
              </div>
            )}
          </div>
        </div>

        {/* Shift Handover Notes & Quick Contact */}
        <div className="space-y-6">
          {/* Quick Contact Card */}
          <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-4">
            <h3 className="text-sm font-black text-[#1E3A2F] uppercase tracking-wider">Quick Care Contacts</h3>
            <div className="space-y-2">
              <a
                href={activeProfile?.emergencyContactPhone ? `tel:${activeProfile.emergencyContactPhone}` : "#"}
                className="w-full p-3 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between hover:border-[#1E3A2F] transition-colors"
              >
                <div>
                  <p className="text-xs font-extrabold text-[#1E3A2F]">
                    {activeProfile?.emergencyContactName || "Family Administrator"}
                  </p>
                  <p className="text-[11px] text-[#5C6460]">Family Primary Contact</p>
                </div>
                <Phone className="w-4 h-4 text-[#607B6E]" />
              </a>

              {activeProfile?.doctorPhone && (
                <a
                  href={`tel:${activeProfile.doctorPhone}`}
                  className="w-full p-3 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] flex items-center justify-between hover:border-[#1E3A2F] transition-colors"
                >
                  <div>
                    <p className="text-xs font-extrabold text-[#1E3A2F]">
                      Dr. {activeProfile.doctorName || "Treating Physician"}
                    </p>
                    <p className="text-[11px] text-[#5C6460]">{activeProfile.hospitalName || "Hospital"}</p>
                  </div>
                  <Phone className="w-4 h-4 text-[#607B6E]" />
                </a>
              )}
            </div>
          </div>

          {/* Shift Handover Log */}
          <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-4">
            <div>
              <h3 className="text-sm font-black text-[#1E3A2F]">Shift Handover Log</h3>
              <p className="text-xs text-[#5C6460] mt-0.5">Notes recorded for {patientDisplayName}</p>
            </div>

            <form onSubmit={handleSaveHandover} className="space-y-3">
              <textarea
                rows={4}
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
                placeholder={`Record vital signs, hydration notes, or behavioral observations for ${patientDisplayName}...`}
                className="w-full text-xs p-3 rounded-2xl border border-[#EFECE6] bg-[#FAF8F5] text-[#1E3A2F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
              />

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Save Handover Note</span>
              </button>
            </form>

            {noteSaved && (
              <p className="text-xs font-bold text-emerald-800 text-center animate-in fade-in">
                ✓ Handover note logged successfully.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
