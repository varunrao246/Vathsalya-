import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  ShieldCheck,
  Send,
  Heart,
  ArrowRight,
  Sparkles,
  User,
  Users,
  Stethoscope,
  Calendar,
  Lock,
  CheckCircle2,
  AlertTriangle,
  HeartHandshake,
  Pill,
  ChevronRight,
  ShieldAlert,
  HelpCircle,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1F2421]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EBF2EE] border border-[#D5E2D9] text-[#1E3A2F] text-xs sm:text-sm font-bold mb-6">
            <Sparkles className="w-4 h-4 text-[#607B6E]" />
            <span>वात्سل್ಯ • AI-Powered Elderly Healthcare &amp; Collaborative Care</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-[#1E3A2F] leading-[1.15]">
            Care beyond generations.
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-[#5C6460] leading-relaxed font-normal">
            Technology should never make older adults feel dependent. VATSALYA preserves dignity and
            independence through accessible simplicity, while keeping trusted family members and
            caretakers seamlessly connected for proactive medication follow-up.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-[#1E3A2F] hover:bg-[#162E25] rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-98"
            >
              <span>Create Healthcare Profile</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/join"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-[#1E3A2F] bg-white hover:bg-[#FAF8F5] border-2 border-[#EFECE6] rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-xs"
            >
              <Lock className="w-5 h-5 text-[#607B6E]" />
              <span>Enter 6-Digit Passcode</span>
            </Link>
          </div>

          {/* Live Role Demonstration Card Grid for Judges */}
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-white border border-[#EFECE6] shadow-xs text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#EFECE6]">
              <div>
                <span className="text-xs font-bold text-[#607B6E] uppercase tracking-wider">
                  Interactive Evaluation Sandbox
                </span>
                <h2 className="text-lg font-bold text-[#1E3A2F]">
                  Experience VATSALYA through three distinct healthcare roles:
                </h2>
              </div>
              <span className="text-xs font-medium text-[#5C6460] bg-[#FAF8F5] px-3 py-1 rounded-full border border-[#EFECE6]">
                Same Healthcare Profile • Role-Specific Access
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {/* Role 1: Elderly Individual */}
              <Link
                href="/dashboard/elderly"
                className="group p-5 rounded-2xl bg-[#FAF8F5] hover:bg-white border-2 border-transparent hover:border-[#1E3A2F] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center mb-4 group-hover:bg-[#1E3A2F] group-hover:text-white transition-colors">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-[#1E3A2F]">Elderly Individual</h3>
                    <span className="text-[11px] font-bold text-[#607B6E] bg-white px-2 py-0.5 rounded border border-[#EFECE6]">
                      Appaji (Age 74)
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#5C6460] leading-relaxed">
                    Accessible 24px+ typography, bilingual Kannada/English guidance, 1-tap &quot;I took my medicine&quot; confirmation button. Zero complex charts.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center justify-between text-xs font-bold text-[#1E3A2F] group-hover:text-[#162E25]">
                  <span>Launch Elderly View</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Role 2: Family Member */}
              <Link
                href="/dashboard/family"
                className="group p-5 rounded-2xl bg-[#FAF8F5] hover:bg-white border-2 border-transparent hover:border-[#1E3A2F] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center mb-4 group-hover:bg-[#1E3A2F] group-hover:text-white transition-colors">
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-[#1E3A2F]">Family Member</h3>
                    <span className="text-[11px] font-bold text-[#607B6E] bg-white px-2 py-0.5 rounded border border-[#EFECE6]">
                      Priya (Daughter)
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#5C6460] leading-relaxed">
                    Peace-of-mind dashboard: 7-day adherence trends, today&apos;s dose status, upcoming doctor consultations, and caretaker oversight.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center justify-between text-xs font-bold text-[#1E3A2F] group-hover:text-[#162E25]">
                  <span>Launch Family View</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>

              {/* Role 3: Caretaker */}
              <Link
                href="/dashboard/caretaker"
                className="group p-5 rounded-2xl bg-[#FAF8F5] hover:bg-white border-2 border-transparent hover:border-[#1E3A2F] transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center mb-4 group-hover:bg-[#1E3A2F] group-hover:text-white transition-colors">
                    <Stethoscope className="w-6 h-6" />
                  </div>
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-base text-[#1E3A2F]">Caretaker</h3>
                    <span className="text-[11px] font-bold text-[#607B6E] bg-white px-2 py-0.5 rounded border border-[#EFECE6]">
                      Ramesh (Attendant)
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#5C6460] leading-relaxed">
                    Daily task checklist, pending confirmation alerts, 1-click escalation resolution (observed administration, verbal reports), shift handover notes.
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center justify-between text-xs font-bold text-[#1E3A2F] group-hover:text-[#162E25]">
                  <span>Launch Caretaker View</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem Statement We Solve */}
      <section className="py-20 bg-white border-y border-[#EFECE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#607B6E] px-3.5 py-1 rounded-full bg-[#EBF2EE] border border-[#D5E2D9]">
              The Core Challenge
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1E3A2F]">
              Why traditional medication apps fail older adults
            </h2>
            <p className="mt-3 text-base text-[#5C6460] leading-relaxed">
              Standard consumer pill reminder apps are designed for young, tech-savvy users. They assume the patient will hear push alerts, navigate complex multi-screen interfaces, and reliably remember their instructions alone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#FDFBF7] border border-[#EFECE6]">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E3A2F]">
                The Solitary Alert Problem
              </h3>
              <p className="mt-3 text-sm text-[#5C6460] leading-relaxed">
                If an elderly person silences or misses a notification on their phone, typical apps do nothing. There is zero human loop, no backup follow-up, and no coordinated safety net.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FDFBF7] border border-[#EFECE6]">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E3A2F]">
                Cognitive &amp; Visual Friction
              </h3>
              <p className="mt-3 text-sm text-[#5C6460] leading-relaxed">
                Small typography, tiny touch targets, and confusing multi-level menus make senior citizens feel dependent and frustrated, causing them to abandon digital adherence tracking altogether.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FDFBF7] border border-[#EFECE6]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E3A2F]">
                The VATSALYA Difference
              </h3>
              <p className="mt-3 text-sm text-[#5C6460] leading-relaxed">
                VATSALYA pairs maximum senior-friendly simplicity on the elder&apos;s phone with automated Smart Care Escalation to Telegram and Email for family members and caretakers when follow-up is needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works: 4-Stage Medication Lifecycle */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#607B6E] px-3.5 py-1 rounded-full bg-[#EBF2EE] border border-[#D5E2D9]">
            Workflow Architecture
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1E3A2F]">
            How VATSALYA Coordinates Care
          </h2>
          <p className="mt-3 text-base text-[#5C6460] leading-relaxed">
            A deterministic, reliable medication lifecycle that never leaves an elderly patient unsupported.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#607B6E] bg-[#EBF2EE] w-7 h-7 rounded-full flex items-center justify-center mb-4">
                1
              </span>
              <h3 className="text-lg font-bold text-[#1E3A2F]">Schedule &amp; Context</h3>
              <p className="mt-2 text-xs text-[#5C6460] leading-relaxed">
                Family or caretakers set up medication with food instructions (e.g. <i>After Breakfast</i>, <i>With Lunch</i>), dosage forms, and specific target times.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center gap-2 text-[11px] font-semibold text-[#1E3A2F]">
              <Pill className="w-3.5 h-3.5 text-[#607B6E]" />
              <span>Multi-slot daily schedules</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#607B6E] bg-[#EBF2EE] w-7 h-7 rounded-full flex items-center justify-center mb-4">
                2
              </span>
              <h3 className="text-lg font-bold text-[#1E3A2F]">Gentle Reminders</h3>
              <p className="mt-2 text-xs text-[#5C6460] leading-relaxed">
                15 minutes before the dose, the elder receives a clear alert. If linked, their official Telegram bot sends a gentle notification in the family&apos;s preferred language.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center gap-2 text-[11px] font-semibold text-[#1E3A2F]">
              <Send className="w-3.5 h-3.5 text-[#607B6E]" />
              <span>Telegram Bot + In-App</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#607B6E] bg-[#EBF2EE] w-7 h-7 rounded-full flex items-center justify-center mb-4">
                3
              </span>
              <h3 className="text-lg font-bold text-[#1E3A2F]">1-Tap Confirmation</h3>
              <p className="mt-2 text-xs text-[#5C6460] leading-relaxed">
                The elder simply taps the large 64px green &quot;I took my medicine&quot; button. Instantly, all family members and caretakers see the dose marked as completed.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center gap-2 text-[11px] font-semibold text-[#1E3A2F]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-time state synchronization</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#607B6E] bg-[#EBF2EE] w-7 h-7 rounded-full flex items-center justify-center mb-4">
                4
              </span>
              <h3 className="text-lg font-bold text-[#1E3A2F]">Smart Escalation</h3>
              <p className="mt-2 text-xs text-[#5C6460] leading-relaxed">
                If the dose remains unconfirmed 30 mins past due, the assigned caretaker receives a priority alert to call or assist in person. At 60 mins, family admins are alerted.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#EFECE6] flex items-center gap-2 text-[11px] font-semibold text-[#1E3A2F]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#B45309]" />
              <span>Multi-tier care escalation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Safety & Dignity Principles */}
      <section className="py-16 bg-[#FAF8F5] border-y border-[#EFECE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-[#EFECE6] shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F]">
                <ShieldCheck className="w-6 h-6 text-[#1E3A2F]" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#1E3A2F]">
                  Clinical Safety &amp; Dignity Guardrails
                </h2>
                <p className="text-xs text-[#5C6460]">Core ethical and medical principles embedded into every layer of VATSALYA</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#5C6460]">
              <div className="space-y-2">
                <h3 className="font-bold text-[#1E3A2F] text-base">Explicit Confirmation Required</h3>
                <p className="leading-relaxed text-xs">
                  A dose is never presumed taken just because time passed or a notification was delivered. A dose transitions to <code>TAKEN</code> only with an explicit user action.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-[#1E3A2F] text-base">Verbal Reports Decoupled from Ingestion</h3>
                <p className="leading-relaxed text-xs">
                  When an elder verbally reports having taken medicine over the phone, the caretaker logs it as <code>ELDER_REPORTS_ALREADY_TAKEN</code>. It resolves the escalation alert without fabricating physical clinical proof.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-[#1E3A2F] text-base">Anti-Doubling Clinical Safeguard</h3>
                <p className="leading-relaxed text-xs">
                  VATSALYA alerts remind loved ones to check in, never encouraging double-dosing. Overdue notifications explicitly display: <i>&quot;Never take an additional dose without consulting the prescribing physician.&quot;</i>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Doctor Appointments & Shared Health Records */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#607B6E] px-3.5 py-1 rounded-full bg-[#EBF2EE] border border-[#D5E2D9]">
              Connected Healthcare
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1E3A2F] leading-tight">
              Doctor Appointments &amp; Secure Member Access
            </h2>
            <p className="mt-4 text-base text-[#5C6460] leading-relaxed">
              Managing elderly healthcare involves more than just daily pills. VATSALYA tracks clinical consultations, diagnostic notes, clinic locations, and companion logistics so no senior ever navigates hospital visits alone.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1E3A2F]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E3A2F]">Single-Use 6-Digit Passcodes</h3>
                  <p className="text-xs text-[#5C6460] mt-0.5">
                    Family members and trusted attendants join the healthcare profile using short-lived 6-digit codes. No shared passwords or credential leakage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1E3A2F]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E3A2F]">Granular Role-Based Permissions</h3>
                  <p className="text-xs text-[#5C6460] mt-0.5">
                    Elderly retain profile autonomy; family admins manage schedules; family viewers inspect adherence; caretakers record shift administration.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#1E3A2F]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E3A2F]">Consultation Companion Tracking</h3>
                  <p className="text-xs text-[#5C6460] mt-0.5">
                    Assign a family companion for clinical checkups. Track clinic parking, vitals history, and post-visit prescription changes in one shared record.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Visual Preview Card */}
          <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F]">
                  <Calendar className="w-5 h-5 text-[#1E3A2F]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1E3A2F]">Upcoming Consultation</h3>
                  <p className="text-xs text-[#5C6460]">Dr. K. S. Ramesh (Cardiology)</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
                In 3 Days
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#EFECE6] space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#607B6E] font-semibold">Location:</span>
                <span className="font-bold text-[#1E3A2F]">Fortis Hospital, Cunningham Road</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#607B6E] font-semibold">Scheduled Time:</span>
                <span className="font-bold text-[#1E3A2F]">Wednesday, 18 Nov • 10:30 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#607B6E] font-semibold">Assigned Companion:</span>
                <span className="font-bold text-[#1E3A2F]">Priya Sharma (Daughter)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#607B6E] font-semibold">Reason:</span>
                <span className="font-bold text-[#1E3A2F]">Hypertension 3-Month Follow-up</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#EBF2EE] border border-[#D5E2D9] text-xs text-[#1E3A2F] flex items-center gap-3">
              <HeartHandshake className="w-5 h-5 shrink-0 text-[#607B6E]" />
              <span>Priya received automated appointment reminder on Telegram with hospital navigation coordinates.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-[#1E3A2F] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-emerald-200 text-xs font-bold">
            <Heart className="w-4 h-4 text-emerald-300" />
            <span>Built for the Catalyst Hackathon</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Give your loved ones the care and independence they deserve.
          </h2>

          <p className="text-base sm:text-lg text-emerald-100 max-w-2xl mx-auto font-normal leading-relaxed">
            Set up an elderly healthcare profile in under 2 minutes. Share access with family members and caretakers with secure 6-digit passcodes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-[#1E3A2F] bg-white hover:bg-emerald-50 rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/join"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5 text-emerald-200" />
              Join with Passcode
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#EFECE6] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#5C6460]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-[#EBF2EE]" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-[#1E3A2F]">
                <span>VATSALYA</span>
                <span className="font-serif text-[#607B6E]">वात्सल्य</span>
              </div>
              <p className="text-[11px] text-[#5C6460]">Care beyond generations • Elderly healthcare &amp; medication management</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <Link href="/dashboard/elderly" className="hover:text-[#1E3A2F] transition-colors">
              Elderly View
            </Link>
            <Link href="/dashboard/family" className="hover:text-[#1E3A2F] transition-colors">
              Family View
            </Link>
            <Link href="/dashboard/caretaker" className="hover:text-[#1E3A2F] transition-colors">
              Caretaker View
            </Link>
            <Link href="/join" className="hover:text-[#1E3A2F] transition-colors">
              Passcode Redemption
            </Link>
          </div>

          <p className="text-center md:text-right text-[11px]">
            &copy; 2026 VATSALYA. Built with Next.js 16, Supabase RLS &amp; Tailwind CSS.
          </p>
        </div>
      </footer>
    </div>
  );
}
