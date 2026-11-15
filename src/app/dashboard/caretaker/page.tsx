"use client";

import { useState } from "react";
import {
  CheckCircle2,
  Clock,
  ClipboardList,
  Send,
  FileText,
  Activity,
} from "lucide-react";

export default function CaretakerDashboard() {
  const [handoverNote, setHandoverNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);

  const handleSaveHandover = (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoverNote.trim()) return;
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 3000);
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
            Shift Active
          </span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Shift Tasks Checklist */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-[#1E3A2F]" />
                <h2 className="text-xl font-bold text-[#1E3A2F]">Assigned Shift Tasks</h2>
              </div>
              <span className="text-xs text-[#5C6460]">1 Completed • 2 Remaining</span>
            </div>

            <div className="space-y-4">
              {/* Task 1: Morning Dose (Completed) */}
              <div className="p-5 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                    <h3 className="text-base font-bold text-[#1E3A2F]">
                      Telmisartan (40 mg) - Morning Dose
                    </h3>
                  </div>
                  <p className="text-xs text-[#5C6460] mt-1 ml-7">
                    Target: 08:30 AM • Self-administered by Appaji after breakfast
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  CONFIRMED
                </span>
              </div>

              {/* Task 2: Afternoon Dose (Due during shift) */}
              <div className="p-5 rounded-2xl bg-white border-2 border-[#1E3A2F] shadow-xs space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-[#B45309]" />
                      <h3 className="text-base font-bold text-[#1E3A2F]">
                        Metformin (500 mg) - Afternoon Dose
                      </h3>
                    </div>
                    <p className="text-xs text-[#5C6460] mt-1 ml-7">
                      Target: 01:30 PM • Administer with lunch
                    </p>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 font-bold">
                    DUE IN 2H
                  </span>
                </div>

                <div className="ml-7 pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    className="px-4 py-2 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white text-xs font-bold transition-colors"
                  >
                    Record Dose Administered
                  </button>
                  <span className="text-xs text-[#5C6460]">Audited under Caretaker Suresh</span>
                </div>
              </div>

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
                <div className="p-2 rounded-lg bg-emerald-50 text-emerald-800 text-xs font-semibold text-center">
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
