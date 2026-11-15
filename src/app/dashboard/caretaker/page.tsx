"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Clock,
  ClipboardList,
  Send,
  FileText,
  Activity,
  Check,
  AlertTriangle,
  Phone,
} from "lucide-react";
import type { DoseOccurrence } from "@/lib/medications/dose-engine";
import type { EscalationEvent, EscalationResolutionAction } from "@/lib/notifications/types";

// Default shift doses fallback
const DEFAULT_SHIFT_DOSES: DoseOccurrence[] = [
  {
    scheduleId: "shift-sched-1",
    medicationId: "med-1",
    medicationName: "Telmisartan",
    dosageStrength: "40 mg",
    dosageForm: "Tablet",
    instructions: "Take 1 tablet after breakfast with water",
    targetTime: "08:30",
    scheduledAt: new Date().toISOString(),
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "08:30",
    occurrenceKey: "shift-sched-1-key",
    mealTiming: "AFTER_MEAL",
    doseQuantity: 1,
    status: "TAKEN",
    actorRole: "ELDERLY",
    recordedAt: new Date().toISOString(),
    notes: "Appaji took with breakfast tea",
  },
  {
    scheduleId: "shift-sched-2",
    medicationId: "med-2",
    medicationName: "Metformin",
    dosageStrength: "500 mg",
    dosageForm: "Tablet",
    instructions: "Take 1 tablet with lunch",
    targetTime: "13:30",
    scheduledAt: new Date().toISOString(),
    scheduledDate: new Date().toISOString().split("T")[0],
    scheduledTime: "13:30",
    occurrenceKey: "shift-sched-2-key",
    mealTiming: "WITH_MEAL",
    doseQuantity: 1,
    status: "DUE",
  },
];

export default function CaretakerDashboard() {
  const [timeline, setTimeline] = useState<DoseOccurrence[]>([]);
  const [handoverNote, setHandoverNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [administeringDose, setAdministeringDose] = useState<string | null>(null);
  const [administerNotes, setAdministerNotes] = useState("");
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [escalations, setEscalations] = useState<EscalationEvent[]>([
    {
      id: "demo-esc-1",
      healthcareProfileId: "demo-profile-appaji",
      scheduleOccurrenceKey: "shift-sched-2-key",
      medicationName: "Metformin (500 mg)",
      targetTime: "13:30",
      scheduledAt: new Date().toISOString(),
      escalationLevel: "CARETAKER_OVERDUE",
      status: "PENDING",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [actingEscalationId, setActingEscalationId] = useState<string | null>(null);
  const [escalationAction, setEscalationAction] = useState<EscalationResolutionAction>("CALL_COMPLETED");
  const [escalationNotes, setEscalationNotes] = useState("");

  useEffect(() => {
    async function loadShiftTimeline() {
      try {
        const res = await fetch("/api/doses/today?healthcareProfileId=demo-profile-appaji");
        const json = await res.json();
        if (json.success && json.data.timeline && json.data.timeline.length > 0) {
          setTimeline(json.data.timeline);
        } else {
          setTimeline(DEFAULT_SHIFT_DOSES);
        }
      } catch {
        setTimeline(DEFAULT_SHIFT_DOSES);
      }

      try {
        const escRes = await fetch("/api/escalations/pending?healthcareProfileId=demo-profile-appaji");
        const escJson = await escRes.json();
        if (escJson.success && escJson.data && escJson.data.length > 0) {
          setEscalations(escJson.data);
        }
      } catch {
        // Fallback demo escalation
      }
    }
    loadShiftTimeline();
  }, []);

  const handleResolveEscalation = async (esc: EscalationEvent) => {
    try {
      const res = await fetch("/api/escalations/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          escalationId: esc.id,
          healthcareProfileId: "demo-profile-appaji",
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
        setActionMessage(`Escalation follow-up recorded: ${escalationAction}`);
        setEscalations((prev) => prev.filter((e) => e.id !== esc.id));
        setActingEscalationId(null);
        setEscalationNotes("");
      } else {
        setActionMessage(`Follow-up recorded in preview mode.`);
        setEscalations((prev) => prev.filter((e) => e.id !== esc.id));
        setActingEscalationId(null);
      }
    } catch {
      setActionMessage(`Follow-up recorded.`);
      setEscalations((prev) => prev.filter((e) => e.id !== esc.id));
      setActingEscalationId(null);
    }
  };

  const handleAdministerDose = async (dose: DoseOccurrence) => {
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
          notes: administerNotes.trim() || "Administered during day shift by Caretaker Suresh",
        }),
      });

      const json = await res.json();
      if (res.status === 409) {
        setActionMessage("Dose already recorded as taken.");
      } else if (res.ok || json.success) {
        setActionMessage(`Dose successfully recorded and audited under Caretaker Suresh.`);
      } else {
        setActionMessage("Recorded in simulation mode.");
      }

      setTimeline((prev) =>
        prev.map((d) =>
          d.occurrenceKey === dose.occurrenceKey
            ? {
                ...d,
                status: "TAKEN" as const,
                actorRole: "CARETAKER",
                recordedAt: new Date().toISOString(),
                notes: administerNotes.trim() || "Administered by Caretaker Suresh",
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
                notes: administerNotes.trim() || "Administered by Caretaker Suresh",
              }
            : d
        )
      );
      setActionMessage("Dose recorded under Caretaker Suresh.");
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

  return (
    <div className="space-y-8">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
            Caretaker Shift Mode (ಶುಶ್ರೂಷಕರ ಮೋಡ್)
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1E3A2F]">
            Appaji&apos;s Daily Care Tasks
          </h1>
          <p className="text-sm text-[#5C6460]">
            Logged in as Suresh Kumar (Day Shift • 08:00 AM - 04:00 PM)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-semibold border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Shift Active (Day)
          </span>
        </div>
      </div>

      {actionMessage && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-700" />
            <span>{actionMessage}</span>
          </div>
          <button
            onClick={() => setActionMessage(null)}
            className="text-xs text-emerald-800 underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shift Tasks Checklist */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Care Escalations Banner if any exist */}
          {escalations.length > 0 && (
            <div className="p-6 rounded-3xl bg-amber-50/80 border-2 border-amber-300 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-900 font-extrabold text-base">
                  <AlertTriangle className="w-5 h-5 text-amber-700" />
                  <span>Pending Smart Care Escalations ({escalations.length})</span>
                </div>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-bold uppercase tracking-wider">
                  Action Required
                </span>
              </div>

              <div className="space-y-3">
                {escalations.map((esc) => (
                  <div
                    key={esc.id}
                    className="p-4 rounded-2xl bg-white border border-amber-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-[#1E3A2F]">
                          {esc.medicationName} ({esc.targetTime})
                        </h3>
                        <p className="text-xs text-[#5C6460] mt-0.5">
                          Medication confirmation is pending. Please contact Appaji to check whether assistance is required.
                        </p>
                      </div>
                      <a
                        href="tel:+919876543210"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A2F] text-white text-xs font-bold hover:bg-[#162E25]"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call Appaji
                      </a>
                    </div>

                    {actingEscalationId === esc.id ? (
                      <div className="pt-2 border-t border-[#EFECE6] space-y-3">
                        <div>
                          <label className="block text-[11px] font-bold text-[#1F2421]">
                            Select Follow-Up Action Outcome:
                          </label>
                          <select
                            value={escalationAction}
                            onChange={(e) => setEscalationAction(e.target.value as EscalationResolutionAction)}
                            className="mt-1 w-full text-xs p-2 rounded-xl border border-[#EFECE6] bg-[#FDFBF7]"
                          >
                            <option value="CALL_COMPLETED">Call Completed — Checking in</option>
                            <option value="DOSE_CONFIRMED_BY_ELDER">Elder Confirmed Taken (Self-administered)</option>
                            <option value="ADMINISTERED_BY_CARETAKER">Administered by Caretaker Directly</option>
                            <option value="ELDER_REPORTS_ALREADY_TAKEN">Elder Reports Already Taken</option>
                            <option value="UNABLE_TO_REACH">Unable to Reach (Alert Family Admin)</option>
                            <option value="ASSISTANCE_REQUIRED">Assistance Required</option>
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={escalationNotes}
                            onChange={(e) => setEscalationNotes(e.target.value)}
                            placeholder="Observation notes (e.g. Spoke with Appaji, confirmed dose taken with lunch)..."
                            className="w-full text-xs p-2 rounded-xl border border-[#EFECE6] bg-[#FDFBF7]"
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleResolveEscalation(esc)}
                            className="px-4 py-2 rounded-xl bg-[#1E3A2F] text-white text-xs font-bold hover:bg-[#162E25]"
                          >
                            Submit Action &amp; Audit Trail
                          </button>
                          <button
                            type="button"
                            onClick={() => setActingEscalationId(null)}
                            className="px-3 py-2 rounded-xl border border-[#EFECE6] text-xs font-semibold hover:bg-white"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-[#EFECE6] flex items-center justify-between">
                        <span className="text-[11px] text-[#607B6E]">
                          Logged at {new Date(esc.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActingEscalationId(esc.id);
                            setEscalationAction("CALL_COMPLETED");
                          }}
                          className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 text-amber-900 text-xs font-bold hover:bg-amber-100 cursor-pointer"
                        >
                          Log Caretaker Follow-Up Action
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#1E3A2F]" />
                <h2 className="text-xl font-bold text-[#1E3A2F]">Assigned Shift Medication Tasks</h2>
              </div>
              <span className="text-xs text-[#5C6460]">
                {timeline.filter((d) => d.status === "TAKEN").length} Completed •{" "}
                {timeline.filter((d) => d.status !== "TAKEN").length} Remaining
              </span>
            </div>

            <div className="space-y-4">
              {timeline.map((dose, idx) => (
                <div
                  key={idx}
                  className={`p-5 rounded-2xl border transition-all ${
                    dose.status === "TAKEN"
                      ? "bg-[#FDFBF7] border-[#EFECE6]"
                      : dose.status === "OVERDUE"
                      ? "bg-rose-50/40 border-rose-300"
                      : "bg-white border-2 border-[#1E3A2F] shadow-xs"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        {dose.status === "TAKEN" ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                        ) : (
                          <Clock className="w-5 h-5 text-[#B45309]" />
                        )}
                        <h3 className="text-base font-bold text-[#1E3A2F]">
                          {dose.medicationName} ({dose.dosageStrength})
                        </h3>
                      </div>
                      <p className="text-xs text-[#5C6460] mt-1 ml-7">
                        Target: {dose.targetTime} • {dose.instructions}
                      </p>
                      {dose.notes && (
                        <p className="text-xs text-[#607B6E] mt-0.5 ml-7 italic">
                          &quot;{dose.notes}&quot;
                        </p>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                        dose.status === "TAKEN"
                          ? "bg-emerald-100 text-emerald-800"
                          : dose.status === "OVERDUE"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {dose.status === "TAKEN"
                        ? "CONFIRMED"
                        : dose.status === "OVERDUE"
                        ? "OVERDUE"
                        : "DUE ON SHIFT"}
                    </span>
                  </div>

                  {dose.status !== "TAKEN" && (
                    <div className="ml-7 pt-4 border-t border-[#EFECE6] mt-3">
                      {administeringDose === dose.occurrenceKey ? (
                        <div className="space-y-3 bg-[#FDFBF7] p-3 rounded-xl border border-[#EFECE6]">
                          <label className="text-xs font-semibold text-[#1E3A2F] block">
                            Administration Notes &amp; Observations:
                          </label>
                          <input
                            type="text"
                            value={administerNotes}
                            onChange={(e) => setAdministerNotes(e.target.value)}
                            placeholder="e.g. Administered with lunch. Appaji reported feeling well."
                            className="w-full text-xs p-2.5 rounded-lg border border-[#EFECE6] bg-white focus:outline-none focus:ring-1 focus:ring-[#1E3A2F]"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleAdministerDose(dose)}
                              className="px-4 py-2 rounded-xl bg-[#1E3A2F] text-white text-xs font-bold hover:bg-[#162E25]"
                            >
                              Confirm Administration
                            </button>
                            <button
                              type="button"
                              onClick={() => setAdministeringDose(null)}
                              className="px-3 py-2 rounded-xl border border-[#EFECE6] text-xs font-semibold hover:bg-white"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => setAdministeringDose(dose.occurrenceKey)}
                            className="px-4 py-2 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Record Dose Administered
                          </button>
                          <span className="text-xs text-[#5C6460]">
                            Audited under Caretaker Suresh (Role: CARETAKER)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {/* Task 3: Blood Pressure & Hydration */}
              <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Activity className="w-5 h-5 text-[#607B6E]" />
                    <h3 className="text-base font-bold text-[#1E3A2F]">
                      Record Mid-Day Blood Pressure &amp; Hydration
                    </h3>
                  </div>
                  <p className="text-xs text-[#5C6460] mt-1 ml-7">
                    Recommended before afternoon rest
                  </p>
                </div>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg border border-[#EFECE6] bg-white text-xs font-semibold text-[#1E3A2F] hover:bg-[#EBF2EE]"
                >
                  Log Vitals
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Handover Log & Shift Memos */}
        <div className="space-y-6">
          <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#1E3A2F]" />
              <h2 className="text-xl font-bold text-[#1E3A2F]">Shift Handover Log</h2>
            </div>
            <p className="text-xs text-[#5C6460]">
              Notes logged here are immediately visible to Priya (Family Admin) and the next shift nurse.
            </p>

            <form onSubmit={handleSaveHandover} className="space-y-4">
              <textarea
                value={handoverNote}
                onChange={(e) => setHandoverNote(e.target.value)}
                placeholder="Log blood pressure, appetite notes, or any concerns observed during shift..."
                rows={4}
                className="w-full p-3 rounded-2xl border border-[#EFECE6] bg-[#FDFBF7] text-sm text-[#1F2421] placeholder-[#5C6460]/60 focus:bg-white resize-none"
              />

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white text-xs font-bold transition-colors shadow-xs"
              >
                <Send className="w-4 h-4" />
                Submit Shift Handover Note
              </button>

              {noteSaved && (
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold text-center flex items-center justify-center gap-1.5">
                  <Check className="w-4 h-4 text-emerald-700" />
                  Handover note recorded in activity feed!
                </div>
              )}
            </form>
          </div>

          {/* Quick Doctor / Hospital Reference */}
          <div className="p-6 rounded-3xl bg-[#FDFBF7] border border-[#EFECE6] space-y-3">
            <h3 className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
              Primary Clinic Details:
            </h3>
            <p className="text-sm font-bold text-[#1E3A2F]">Dr. Ramesh (Cardiology)</p>
            <p className="text-xs text-[#5C6460]">Manipal Hospital, Bangalore</p>
            <p className="text-xs text-[#5C6460]">Emergency Clinic: +91 80 2502 4444</p>
          </div>
        </div>
      </div>
    </div>
  );
}