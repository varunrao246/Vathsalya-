import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  ShieldCheck,
  Send,
  Heart,
  ArrowRight,
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
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar />

      {/* Hero Section: Two-Column Intergenerational Storytelling */}
      <section className="relative pt-8 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Emotional Message & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Cultural & Clinical Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F3EDE5] border border-[#E8E2D9] text-[#1C1917] text-xs sm:text-sm font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#0F766E] animate-pulse" />
              <span className="font-serif font-bold text-[#0F766E]">वात्सल्य</span>
              <span className="text-[#57534E]">• Care beyond generations</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1C1917] leading-[1.12]">
              Care that connects <span className="text-[#0F766E]">generations.</span>
            </h1>

            {/* Empathetic Supporting Copy */}
            <p className="text-base sm:text-lg lg:text-xl text-[#57534E] leading-relaxed font-normal max-w-2xl">
              Because caring for our parents should never depend on remembering everything alone.
              VATSALYA brings families, elderly individuals and caretakers together to make everyday
              care safer, simpler and more connected.
            </p>

            {/* Primary Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/register"
                className="px-7 py-4 text-base font-bold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <span>Create Healthcare Profile</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/join"
                className="px-7 py-4 text-base font-bold text-[#1C1917] bg-white hover:bg-[#F3EDE5] border border-[#E8E2D9] rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-xs"
              >
                <Lock className="w-4 h-4 text-[#0F766E]" />
                <span>Enter 6-Digit Passcode</span>
              </Link>
            </div>

            {/* Sub-CTA Trust Indicator */}
            <div className="flex items-center gap-3 text-xs text-[#57534E] pt-1">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                Senior-first 64px touch targets
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                Automated multi-channel escalation
              </span>
            </div>
          </div>

          {/* Right Column: Family Visual Showcase with Gentle Motion */}
          <div className="lg:col-span-5 relative">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              {/* Main Editorial Image Container */}
              <div className="relative rounded-3xl border border-[#E8E2D9] bg-white p-2.5 shadow-md overflow-hidden">
                <div className="relative h-[340px] sm:h-[400px] w-full rounded-2xl overflow-hidden bg-[#F3EDE5]">
                  <Image
                    src="/images/family-mother-daughter.jpg"
                    alt="An elderly Indian mother sharing warm morning tea with her adult daughter in a sunlit home, smiling with genuine joy and dignity"
                    fill
                    priority
                    className="object-cover object-center motion-kenburns transition-transform duration-1000"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />

                  {/* Floating Caption on Primary Photo */}
                  <div className="absolute bottom-4 left-4 right-4 p-3.5 rounded-xl bg-white/95 backdrop-blur-md border border-[#E8E2D9] shadow-sm">
                    <p className="text-xs font-bold text-[#1C1917]">
                      &quot;Connecting families, one thoughtful moment at a time.&quot;
                    </p>
                    <p className="text-[11px] text-[#57534E] mt-0.5">
                      Dignity, love and shared responsibility in everyday health.
                    </p>
                  </div>
                </div>
              </div>

              {/* Smaller Overlapping Secondary Image Card */}
              <div className="hidden sm:block absolute -bottom-6 -left-6 w-44 rounded-2xl border-2 border-white bg-white p-2 shadow-lg motion-float">
                <div className="relative h-28 w-full rounded-xl overflow-hidden bg-[#F3EDE5]">
                  <Image
                    src="/images/family-tea-detail.jpg"
                    alt="Close-up detail of shared morning tea and warm family bonding"
                    fill
                    className="object-cover"
                    sizes="170px"
                  />
                </div>
                <div className="pt-2 text-center">
                  <span className="text-[11px] font-extrabold text-[#0F766E] uppercase tracking-wider block">
                    Shared Routine
                  </span>
                  <span className="text-[10px] text-[#57534E]">1-tap confirmation</span>
                </div>
              </div>

              {/* Floating Emotional Badge */}
              <div className="absolute -top-3 -right-3 px-3.5 py-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-xs font-bold shadow-xs flex items-center gap-1.5 motion-float">
                <Heart className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                <span>Care is better when shared</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Role Demonstration Sandbox Grid */}
        <div className="mt-14 p-6 sm:p-8 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs text-left">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-[#E8E2D9]">
            <div>
              <span className="text-xs font-bold text-[#0F766E] uppercase tracking-wider">
                Interactive Evaluation Sandbox
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-[#1C1917]">
                Experience VATSALYA through three distinct healthcare perspectives:
              </h2>
            </div>
            <span className="text-xs font-semibold text-[#57534E] bg-[#F3EDE5] px-3 py-1 rounded-full border border-[#E8E2D9] self-start sm:self-auto">
              Same Healthcare Profile • Role-Specific Access
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {/* Role 1: Elderly Individual */}
            <Link
              href="/dashboard/elderly"
              className="group p-5 rounded-2xl bg-[#FAF8F5] hover:bg-white border-2 border-transparent hover:border-[#0F766E] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center mb-4 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#1C1917]">Elderly Individual</h3>
                  <span className="text-[11px] font-bold text-[#0F766E] bg-white px-2 py-0.5 rounded border border-[#E8E2D9]">
                    Appaji (Age 74)
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                  Accessible 24px+ typography, bilingual Kannada/English guidance, 1-tap &quot;I took my medicine&quot; confirmation button. Zero complex charts.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center justify-between text-xs font-bold text-[#0F766E]">
                <span>Launch Elderly View</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Role 2: Family Member */}
            <Link
              href="/dashboard/family"
              className="group p-5 rounded-2xl bg-[#FAF8F5] hover:bg-white border-2 border-transparent hover:border-[#0F766E] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center mb-4 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#1C1917]">Family Member</h3>
                  <span className="text-[11px] font-bold text-[#0F766E] bg-white px-2 py-0.5 rounded border border-[#E8E2D9]">
                    Priya (Daughter)
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                  Peace-of-mind dashboard: 7-day adherence trends, today&apos;s dose status, upcoming doctor consultations, and caretaker oversight.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center justify-between text-xs font-bold text-[#0F766E]">
                <span>Launch Family View</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>

            {/* Role 3: Caretaker */}
            <Link
              href="/dashboard/caretaker"
              className="group p-5 rounded-2xl bg-[#FAF8F5] hover:bg-white border-2 border-transparent hover:border-[#0F766E] transition-all flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center mb-4 group-hover:bg-[#0F766E] group-hover:text-white transition-colors">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-[#1C1917]">Caretaker</h3>
                  <span className="text-[11px] font-bold text-[#0F766E] bg-white px-2 py-0.5 rounded border border-[#E8E2D9]">
                    Ramesh (Attendant)
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                  Daily task checklist, pending confirmation alerts, 1-click escalation resolution (observed administration, verbal reports), shift handover notes.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center justify-between text-xs font-bold text-[#0F766E]">
                <span>Launch Caretaker View</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
          <p className="text-[11px] text-[#57534E] mt-4 text-center">
            * Sandbox roles allow interactive demonstration without modifying production account data.
          </p>
        </div>
      </section>

      {/* The Problem Statement We Solve */}
      <section className="py-20 bg-white border-y border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] px-3.5 py-1 rounded-full bg-[#F3EDE5] border border-[#E8E2D9]">
              The Core Challenge
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1C1917]">
              Why traditional medication apps fail older adults
            </h2>
            <p className="mt-3 text-base text-[#57534E] leading-relaxed">
              Standard consumer pill reminder apps are designed for young, tech-savvy users. They assume the patient will hear push alerts, navigate complex multi-screen interfaces, and reliably remember their instructions alone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 flex items-center justify-center mb-6">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917]">
                The Solitary Alert Problem
              </h3>
              <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                If an elderly person silences or misses a notification on their phone, typical apps do nothing. There is zero human loop, no backup follow-up, and no coordinated safety net.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-6">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917]">
                Cognitive &amp; Visual Friction
              </h3>
              <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                Small typography, tiny touch targets, and confusing multi-level menus make senior citizens feel dependent and frustrated, causing them to abandon digital adherence tracking altogether.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9]">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#0F766E] flex items-center justify-center mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1C1917]">
                The VATSALYA Difference
              </h3>
              <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                VATSALYA pairs maximum senior-friendly simplicity on the elder&apos;s phone with automated Smart Care Escalation to Telegram and Email for family members and caretakers when follow-up is needed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works: 4-Stage Medication Lifecycle */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] px-3.5 py-1 rounded-full bg-[#F3EDE5] border border-[#E8E2D9]">
            Workflow Architecture
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1C1917]">
            How VATSALYA Coordinates Care
          </h2>
          <p className="mt-3 text-base text-[#57534E] leading-relaxed">
            A deterministic, reliable medication lifecycle that never leaves an elderly patient unsupported.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#0F766E] bg-[#F3EDE5] w-7 h-7 rounded-full flex items-center justify-center mb-4">
                1
              </span>
              <h3 className="text-lg font-bold text-[#1C1917]">Schedule &amp; Context</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                Family or caretakers set up medication with food instructions (e.g. <i>After Breakfast</i>, <i>With Lunch</i>), dosage forms, and specific target times.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center gap-2 text-[11px] font-semibold text-[#1C1917]">
              <Pill className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Multi-slot daily schedules</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#0F766E] bg-[#F3EDE5] w-7 h-7 rounded-full flex items-center justify-center mb-4">
                2
              </span>
              <h3 className="text-lg font-bold text-[#1C1917]">Gentle Reminders</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                15 minutes before the dose, the elder receives a clear alert. If linked, their official Telegram bot sends a gentle notification in the family&apos;s preferred language.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center gap-2 text-[11px] font-semibold text-[#1C1917]">
              <Send className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Telegram Bot + In-App</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#0F766E] bg-[#F3EDE5] w-7 h-7 rounded-full flex items-center justify-center mb-4">
                3
              </span>
              <h3 className="text-lg font-bold text-[#1C1917]">1-Tap Confirmation</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                The elder simply taps the large 64px &quot;Mark as Taken&quot; button. Instantly, all family members and caretakers see the dose marked as completed.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center gap-2 text-[11px] font-semibold text-[#1C1917]">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Real-time state synchronization</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-black text-[#0F766E] bg-[#F3EDE5] w-7 h-7 rounded-full flex items-center justify-center mb-4">
                4
              </span>
              <h3 className="text-lg font-bold text-[#1C1917]">Smart Escalation</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                If the dose remains unconfirmed 30 mins past due, the assigned caretaker receives a priority alert to call or assist in person. At 60 mins, family admins are alerted.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex items-center gap-2 text-[11px] font-semibold text-[#1C1917]">
              <ShieldAlert className="w-3.5 h-3.5 text-[#D97706]" />
              <span>Multi-tier care escalation</span>
            </div>
          </div>
        </div>
      </section>

      {/* Clinical Safety & Dignity Principles */}
      <section className="py-16 bg-white border-y border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] shadow-xs">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#F3EDE5] flex items-center justify-center text-[#0F766E]">
                <ShieldCheck className="w-6 h-6 text-[#0F766E]" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-[#1C1917]">
                  Clinical Safety &amp; Dignity Guardrails
                </h2>
                <p className="text-xs text-[#57534E]">Core ethical and medical principles embedded into every layer of VATSALYA</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-[#57534E]">
              <div className="space-y-2">
                <h3 className="font-bold text-[#1C1917] text-base">Explicit Confirmation Required</h3>
                <p className="leading-relaxed text-xs">
                  A dose is never presumed taken just because time passed or a notification was delivered. A dose transitions to <code>TAKEN</code> only with an explicit user action.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-[#1C1917] text-base">Verbal Reports Decoupled from Ingestion</h3>
                <p className="leading-relaxed text-xs">
                  When an elder verbally reports having taken medicine over the phone, the caretaker logs it as <code>ELDER_REPORTS_ALREADY_TAKEN</code>. It resolves the escalation alert without fabricating physical clinical proof.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-[#1C1917] text-base">Anti-Doubling Clinical Safeguard</h3>
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
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] px-3.5 py-1 rounded-full bg-[#F3EDE5] border border-[#E8E2D9]">
              Connected Healthcare
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1C1917] leading-tight">
              Doctor Appointments &amp; Secure Member Access
            </h2>
            <p className="mt-4 text-base text-[#57534E] leading-relaxed">
              Managing elderly healthcare involves more than just daily pills. VATSALYA tracks clinical consultations, diagnostic notes, clinic locations, and companion logistics so no senior ever navigates hospital visits alone.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F3EDE5] flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1917]">Single-Use 6-Digit Passcodes</h3>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Family members and trusted attendants join the healthcare profile using short-lived 6-digit codes. No shared passwords or credential leakage.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F3EDE5] flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1917]">Granular Role-Based Permissions</h3>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Elderly retain profile autonomy; family admins manage schedules; family viewers inspect adherence; caretakers record shift administration.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F3EDE5] flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1917]">Consultation Companion Tracking</h3>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Assign a family companion for clinical checkups. Track clinic parking, vitals history, and post-visit prescription changes in one shared record.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Visual Preview Card */}
          <div className="p-8 rounded-3xl bg-white border border-[#E8E2D9] shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F3EDE5] flex items-center justify-center text-[#0F766E]">
                  <Calendar className="w-5 h-5 text-[#0F766E]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1917]">Upcoming Consultation</h3>
                  <p className="text-xs text-[#57534E]">Dr. K. S. Ramesh (Cardiology)</p>
                </div>
              </div>
              <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F3EDE5] text-[#0F766E]">
                In 3 Days
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-[#57534E] font-semibold">Location:</span>
                <span className="font-bold text-[#1C1917]">Fortis Hospital, Cunningham Road</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57534E] font-semibold">Scheduled Time:</span>
                <span className="font-bold text-[#1C1917]">Wednesday, 18 Nov • 10:30 AM</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57534E] font-semibold">Assigned Companion:</span>
                <span className="font-bold text-[#1C1917]">Priya Sharma (Daughter)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#57534E] font-semibold">Reason:</span>
                <span className="font-bold text-[#1C1917]">Hypertension 3-Month Follow-up</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#F3EDE5] border border-[#E8E2D9] text-xs text-[#1C1917] flex items-center gap-3">
              <HeartHandshake className="w-5 h-5 shrink-0 text-[#0F766E]" />
              <span>Priya received automated appointment reminder on Telegram with hospital navigation coordinates.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-20 bg-[#0F766E] text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-emerald-100 text-xs font-bold">
            <Heart className="w-4 h-4 text-emerald-300" />
            <span>Built for Families &amp; Caretakers</span>
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
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-[#0F766E] bg-white hover:bg-[#F3EDE5] rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
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
      <footer className="bg-white border-t border-[#E8E2D9] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#57534E]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F766E] text-white flex items-center justify-center">
              <HeartHandshake className="w-5 h-5 text-[#FAF8F5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 font-bold text-[#1C1917]">
                <span>VATSALYA</span>
                <span className="font-serif text-[#0F766E]">वात्सल्य</span>
              </div>
              <p className="text-[11px] text-[#57534E]">Care beyond generations • Elderly healthcare &amp; medication management</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 font-semibold">
            <Link href="/dashboard/elderly" className="hover:text-[#0F766E] transition-colors">
              Elderly View
            </Link>
            <Link href="/dashboard/family" className="hover:text-[#0F766E] transition-colors">
              Family View
            </Link>
            <Link href="/dashboard/caretaker" className="hover:text-[#0F766E] transition-colors">
              Caretaker View
            </Link>
            <Link href="/join" className="hover:text-[#0F766E] transition-colors">
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
