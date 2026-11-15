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
  ShieldAlert,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  Check,
  FileText,
  Activity,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1C1917]">
      <Navbar />

      {/* Hero Section: Two-Column Intergenerational Storytelling */}
      <section className="relative pt-8 pb-16 md:pt-14 md:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Emotional Message & Actions */}
          <div className="lg:col-span-7 space-y-6 text-left">
            {/* Main Headline (Repeated branding badge removed as requested) */}
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
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#57534E] pt-1">
              <span className="inline-flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                Senior-first 64px touch targets
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                Automated multi-channel escalation
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-[#0F766E]" />
                Passcode-governed family circles
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
      </section>

      {/* SECTION 2: Role Cards — Informational, Not Navigational */}
      <section className="py-16 bg-white border-y border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] px-3.5 py-1 rounded-full bg-[#F3EDE5] border border-[#E8E2D9]">
              Role-Based Healthcare Coordination
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
              One platform. Three roles. Connected care.
            </h2>
            <p className="mt-3 text-base text-[#57534E] leading-relaxed">
              Every person has a role. Every role has the right level of access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Informational Role Card 1: Elderly Individual */}
            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] flex flex-col justify-between space-y-5">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center mb-5 shadow-xs">
                  <User className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-lg text-[#1C1917]">Elderly Individual</h3>
                  <span className="text-[11px] font-bold text-[#0F766E] bg-white px-2.5 py-1 rounded-full border border-[#E8E2D9]">
                    Primary Autonomy
                  </span>
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed mb-4">
                  Preserves independence and personal agency with simple, senior-friendly tools:
                </p>
                <ul className="space-y-2.5 text-xs text-[#1C1917]">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Manages personal healthcare information.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Views medication schedules.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Records medication actions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Remains central to personal care decisions.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#E8E2D9] text-[11px] text-[#57534E] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>Large 64px touch targets &amp; regional language audio</span>
              </div>
            </div>

            {/* Informational Role Card 2: Family Member */}
            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] flex flex-col justify-between space-y-5">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center mb-5 shadow-xs">
                  <Users className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-lg text-[#1C1917]">Family Member</h3>
                  <span className="text-[11px] font-bold text-[#0F766E] bg-white px-2.5 py-1 rounded-full border border-[#E8E2D9]">
                    Support &amp; Oversight
                  </span>
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed mb-4">
                  Gives adult children peace of mind with real-time transparency and coordination:
                </p>
                <ul className="space-y-2.5 text-xs text-[#1C1917]">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Supports healthcare coordination.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Views authorized care updates.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Receives relevant notifications.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Helps coordinate appointments and follow-ups.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#E8E2D9] text-[11px] text-[#57534E] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>Grounded AI summaries &amp; adherence trends</span>
              </div>
            </div>

            {/* Informational Role Card 3: Caretaker */}
            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] flex flex-col justify-between space-y-5">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center mb-5 shadow-xs">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-extrabold text-lg text-[#1C1917]">Caretaker</h3>
                  <span className="text-[11px] font-bold text-[#0F766E] bg-white px-2.5 py-1 rounded-full border border-[#E8E2D9]">
                    Daily Assistance
                  </span>
                </div>
                <p className="text-xs text-[#57534E] leading-relaxed mb-4">
                  Empowers home attendants and nurses with clear shift routines and follow-up logging:
                </p>
                <ul className="space-y-2.5 text-xs text-[#1C1917]">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Assists with daily care routines.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Helps monitor medication adherence.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Records follow-up actions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Communicates relevant updates to authorized family members.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#E8E2D9] text-[11px] text-[#57534E] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>Shift task queues &amp; handover documentation</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: Closed-Loop Care Journey */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] px-3.5 py-1 rounded-full bg-[#F3EDE5] border border-[#E8E2D9]">
            Continuous Care Architecture
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
            Care doesn&apos;t stop at reminders.
          </h2>
          <p className="mt-3 text-base text-[#57534E] leading-relaxed">
            VATSALYA connects medication reminders, dose actions, follow-ups and family communication into one continuous care journey.
          </p>
        </div>

        {/* 6 Connected Stages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Stage 1 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  1
                </span>
                <Clock className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Medication scheduled</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                Doctor prescriptions, meal instructions (e.g. <i>After Breakfast</i>), dosage strengths, and reminder lead times are configured in the profile timezone.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#0F766E]">
              Stage 1 • Prescription Schedule
            </div>
          </div>

          {/* Stage 2 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  2
                </span>
                <Send className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Elderly person receives a reminder</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                15 minutes prior to target time, a friendly notification arrives on the elder&apos;s phone via Telegram bot and clear high-contrast in-app prompts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#0F766E]">
              Stage 2 • Gentle Proactive Alert
            </div>
          </div>

          {/* Stage 3 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  3
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Dose action is recorded</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                The elder taps the large 64px button to confirm taking their medicine, or an attendant logs direct shift administration with mandatory notes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-emerald-700">
              Stage 3 • Action Recording
            </div>
          </div>

          {/* Stage 4 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  4
                </span>
                <Activity className="w-4 h-4 text-[#D97706]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Medication status is evaluated</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                The deterministic engine tracks confirmation status against the clinical grace window. Doses transition from <code>SCHEDULED</code> to <code>TAKEN</code> or <code>OVERDUE</code>.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#D97706]">
              Stage 4 • Status Evaluation
            </div>
          </div>

          {/* Stage 5 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  5
                </span>
                <ShieldAlert className="w-4 h-4 text-[#B45309]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Family or caretaker is notified when necessary</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                If a dose remains unconfirmed past 30 minutes, caretakers receive an urgent alert to call or check in. At 60 minutes, family guardians receive priority escalation.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#B45309]">
              Stage 5 • Multi-Tier Escalation
            </div>
          </div>

          {/* Stage 6 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  6
                </span>
                <FileText className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Shared care history is updated</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                Every action, phone follow-up, and confirmation is logged into an immutable care timeline, updating adherence trends and Google Gemini daily summaries.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#0F766E]">
              Stage 6 • Audit History &amp; Peace of Mind
            </div>
          </div>
        </div>

        {/* Clinical Accuracy Callout */}
        <div className="mt-10 p-5 rounded-2xl bg-[#F3EDE5] border border-[#E8E2D9] text-xs text-[#57534E] leading-relaxed flex items-start gap-3">
          <Info className="w-5 h-5 text-[#0F766E] shrink-0 mt-0.5" />
          <div>
            <strong className="text-[#1C1917] block mb-0.5">Clinical Accuracy &amp; Verification Boundary:</strong>
            A recorded dose action documents user confirmation and does not constitute physical proof of chemical ingestion. Verbal reports over phone (e.g. <code>ELDER_REPORTS_ALREADY_TAKEN</code>) remain unverified verbal notes until confirmed. VATSALYA coordinates care routines and does not diagnose conditions or prescribe medications.
          </div>
        </div>
      </section>

      {/* SECTION 4: Separate Demo Access Entry Point for Hackathon Judges */}
      <section className="py-12 bg-white border-y border-[#E8E2D9]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-10 rounded-3xl bg-[#FAF8F5] border-2 border-[#E8E2D9] shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#1C1917]">
                    Explore Demo (Fictional Sample Profiles)
                  </h3>
                  <p className="text-xs text-[#57534E]">
                    Interactive demonstration sandbox designed specifically for hackathon evaluation
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-[#B45309] bg-[#FEF3C7] px-3.5 py-1.5 rounded-full border border-[#FDE68A] self-start sm:self-center">
                Isolated Sandbox
              </span>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-[#57534E] leading-relaxed">
              Explore VATSALYA&apos;s three distinct role interfaces using simulated sample profiles (Appaji, Priya, and Ramesh). This isolated demonstration environment uses fictional sample data to demonstrate features without requiring account registration. Demo access never modifies real user records and does not grant real healthcare permissions.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/elderly"
                className="p-4 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#0F766E] text-[#1C1917] hover:text-[#0F766E] transition-all flex items-center justify-between text-xs font-bold shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0F766E]" />
                  <span>Elderly Demo (Appaji)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/dashboard/family"
                className="p-4 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#0F766E] text-[#1C1917] hover:text-[#0F766E] transition-all flex items-center justify-between text-xs font-bold shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0F766E]" />
                  <span>Family Demo (Priya)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/dashboard/caretaker"
                className="p-4 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#0F766E] text-[#1C1917] hover:text-[#0F766E] transition-all flex items-center justify-between text-xs font-bold shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  <Stethoscope className="w-4 h-4 text-[#0F766E]" />
                  <span>Caretaker Demo (Ramesh)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: The Problem Statement We Solve */}
      <section className="py-20 bg-white border-b border-[#E8E2D9]">
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

      {/* SECTION 6: Doctor Appointments & Secure Member Access */}
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
