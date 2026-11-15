import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  ShieldCheck,
  Heart,
  ArrowRight,
  User,
  Users,
  Stethoscope,
  Calendar,
  Lock,
  CheckCircle2,
  HeartHandshake,
  Clock,
  Sparkles,
  Info,
  Check,
  Bell,
  Activity,
  Shield,
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
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1C1917] leading-[1.14]">
              Care for your loved ones. <br className="hidden sm:inline" />
              <span className="text-[#0F766E]">Peace of mind</span> for your family.
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#57534E] leading-relaxed font-normal max-w-2xl">
              Keep medication routines on track, connect family members and caretakers, and make everyday care easier.
            </p>

            {/* Prominent CTAs: Exactly Two Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <Link
                href="/register"
                className="px-8 py-4 text-base font-bold text-white bg-[#0F766E] hover:bg-[#0D655E] rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2.5 active:scale-[0.98]"
              >
                <span>Start a Care Profile</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="#demo-sandbox"
                className="px-8 py-4 text-base font-bold text-[#1C1917] bg-white hover:bg-[#F3EDE5] border border-[#E8E2D9] rounded-2xl transition-all flex items-center justify-center gap-2.5 shadow-xs"
              >
                <Sparkles className="w-4 h-4 text-[#0F766E]" />
                <span>Explore Demo</span>
              </Link>
            </div>

            {/* Reassuring Care Highlights */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-[#57534E] pt-2">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                Simple reminders on phone
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
                Family alerted when follow-up is needed
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5 font-medium">
                <Lock className="w-4 h-4 text-[#0F766E]" />
                Secure role-based access
              </span>
            </div>
          </div>

          {/* Right Column: Hero Visual Showcase without Overlapping Bugs */}
          <div className="lg:col-span-5 w-full">
            <div className="mx-auto max-w-md lg:max-w-none">
              {/* Floating Reassuring Badge */}
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FEF3C7] border border-[#FDE68A] text-[#B45309] text-xs font-bold shadow-xs mb-3">
                <Heart className="w-3.5 h-3.5 fill-[#D97706] text-[#D97706]" />
                <span>Care is better when shared</span>
              </div>

              {/* Main Photograph Container */}
              <div className="rounded-3xl border border-[#E8E2D9] bg-white p-2.5 shadow-sm">
                <div className="relative h-[340px] sm:h-[400px] w-full rounded-2xl overflow-hidden bg-[#F3EDE5]">
                  <Image
                    src="/images/family-mother-daughter.jpg"
                    alt="Elderly Indian mother sharing warm morning tea with her adult daughter in a sunlit home"
                    fill
                    priority
                    className="object-cover object-center"
                    sizes="(max-width: 768px) 100vw, 500px"
                  />
                </div>
              </div>

              {/* Caption Card: Fully visible below the main photograph */}
              <div className="mt-3 p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-xs">
                <p className="text-xs font-bold text-[#1C1917]">
                  &quot;Connecting families, one thoughtful moment at a time.&quot;
                </p>
                <p className="text-[11px] text-[#57534E] mt-0.5">
                  Dignity, love and shared responsibility in everyday health.
                </p>
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
                    <span>Clear, senior-friendly reminders with high-contrast buttons.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>One-tap dose confirmation designed for comfort.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Independence with caring family support.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Remains central to personal healthcare decisions.</span>
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
                    <span>Visibility into daily medication routines and doctor visits.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Timely alerts if a dose needs follow-up.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Peace of mind from anywhere.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Supports coordination without taking away autonomy.</span>
                  </li>
                </ul>
              </div>
              <div className="pt-4 border-t border-[#E8E2D9] text-[11px] text-[#57534E] flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-[#0F766E] shrink-0" />
                <span>Daily adherence trends &amp; automated Telegram updates</span>
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
                    <span>Assists with daily care routines and shift checklists.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Reliable medication tracking and administration notes.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Records follow-up actions and shift logs.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#0F766E] shrink-0 mt-0.5" />
                    <span>Communicates updates with authorized family members.</span>
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

      {/* SECTION 3: Four-Step Care Journey (Simplified & Human-Centered) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] px-3.5 py-1 rounded-full bg-[#F3EDE5] border border-[#E8E2D9]">
            How VATSALYA Works
          </span>
          <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
            A simple routine for lasting peace of mind.
          </h2>
          <p className="mt-3 text-base text-[#57534E] leading-relaxed">
            Four clear steps that connect loved ones, family members, and caretakers into one supportive circle.
          </p>
        </div>

        {/* 4 Visual Steps */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  1
                </span>
                <Clock className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Create a care profile</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                Add medication details, meal instructions, dosage strengths, and doctor consultation notes in minutes.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#0F766E]">
              Step 1 • Profile Setup
            </div>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  2
                </span>
                <Bell className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Set medication reminders</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                Seniors receive simple, timely prompts on Telegram or in the app with high-contrast, one-tap buttons.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#0F766E]">
              Step 2 • Gentle Reminders
            </div>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  3
                </span>
                <Activity className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Stay informed through updates</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                Family members and caretakers view recorded doses and daily progress in a transparent, shared care history.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#0F766E]">
              Step 3 • Shared Visibility
            </div>
          </div>

          {/* Step 4 */}
          <div className="p-6 rounded-3xl bg-white border border-[#E8E2D9] shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="w-8 h-8 rounded-full bg-[#F3EDE5] text-[#0F766E] font-black text-sm flex items-center justify-center">
                  4
                </span>
                <ShieldCheck className="w-4 h-4 text-[#0F766E]" />
              </div>
              <h3 className="text-base font-bold text-[#1C1917]">Follow up together</h3>
              <p className="mt-2 text-xs text-[#57534E] leading-relaxed">
                If a dose is missed, family is alerted promptly so someone can check in with care and coordinate support.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#E8E2D9] text-[11px] font-semibold text-[#0F766E]">
              Step 4 • Coordinated Safety
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 4: Separate Demo Access Entry Point for Hackathon Judges */}
      <section id="demo-sandbox" className="py-12 bg-white border-y border-[#E8E2D9]">
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
                Fictional Sandbox
              </span>
            </div>

            <p className="mt-4 text-xs sm:text-sm text-[#57534E] leading-relaxed">
              Explore VATSALYA&apos;s three distinct role interfaces using simulated sample profiles (Appaji, Priya, and Ramesh). This isolated demonstration environment uses fictional sample data to demonstrate features without requiring account registration. Demo access never modifies real user records and does not grant real healthcare permissions.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/elderly?demo=true"
                className="p-4 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#0F766E] text-[#1C1917] hover:text-[#0F766E] transition-all flex items-center justify-between text-xs font-bold shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-[#0F766E]" />
                  <span>Elderly Demo (Appaji)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/dashboard/family?demo=true"
                className="p-4 rounded-2xl bg-white border border-[#E8E2D9] hover:border-[#0F766E] text-[#1C1917] hover:text-[#0F766E] transition-all flex items-center justify-between text-xs font-bold shadow-xs group"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#0F766E]" />
                  <span>Family Demo (Priya)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/dashboard/caretaker?demo=true"
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

      {/* SECTION 5: Trust and Safety Section */}
      <section className="py-20 bg-white border-b border-[#E8E2D9]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] px-3.5 py-1 rounded-full bg-[#F3EDE5] border border-[#E8E2D9]">
              Trust &amp; Safety
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1C1917] tracking-tight">
              Designed for privacy, dignity, and clinical safety.
            </h2>
            <p className="mt-3 text-base text-[#57534E] leading-relaxed">
              Healthcare information is deeply personal. VATSALYA is built with strict privacy boundaries and verified security controls.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#0F766E]" />
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">Role-Based Access</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Authorized permissions ensure each person only sees what is appropriate for their care role.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center">
                <Lock className="w-5 h-5 text-[#0F766E]" />
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">Protected Health Data</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Information is protected with Row Level Security (RLS) and secondary passcode checks for sensitive changes.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center">
                <Activity className="w-5 h-5 text-[#0F766E]" />
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">Reliable Coordination</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                Medication actions and follow-up notes are recorded to coordinate care and keep family updated.
              </p>
            </div>

            <div className="p-7 rounded-3xl bg-[#FAF8F5] border border-[#E8E2D9] space-y-3">
              <div className="w-10 h-10 rounded-2xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center">
                <Info className="w-5 h-5 text-[#0F766E]" />
              </div>
              <h3 className="font-bold text-base text-[#1C1917]">Clinical Safety Boundary</h3>
              <p className="text-xs text-[#57534E] leading-relaxed">
                VATSALYA coordinates care routines and does not diagnose medical conditions or prescribe or modify medications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: Doctor Appointments & Passcode Join Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0F766E] px-3.5 py-1 rounded-full bg-[#F3EDE5] border border-[#E8E2D9]">
              Connected Healthcare
            </span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold text-[#1C1917] leading-tight">
              Doctor appointments and secure circle access.
            </h2>
            <p className="mt-4 text-base text-[#57534E] leading-relaxed">
              Managing healthcare involves more than daily pills. VATSALYA tracks doctor consultations, clinic locations, and companion logistics so no elder ever visits the hospital alone.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-[#F3EDE5] flex items-center justify-center text-[#0F766E] shrink-0 mt-0.5">
                  <CheckCircle2 className="w-4 h-4 text-[#0F766E]" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#1C1917]">Single-Use 6-Digit Passcodes</h3>
                  <p className="text-xs text-[#57534E] mt-0.5">
                    Family members and trusted attendants join the care circle using short-lived passcodes. No shared passwords.
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
                    Assign a family companion for clinical checkups. Track clinic timing, notes, and instructions together.
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
              <span>Automated appointment reminder sent to family companion with hospital details.</span>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Banner: Single Primary CTA */}
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
              Start a Care Profile
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="#demo-sandbox"
              className="w-full sm:w-auto px-8 py-4 text-base font-bold text-white bg-white/10 hover:bg-white/20 border border-white/20 rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5 text-emerald-200" />
              Explore Demo
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
            <Link href="/dashboard/elderly?demo=true" className="hover:text-[#0F766E] transition-colors">
              Elderly View
            </Link>
            <Link href="/dashboard/family?demo=true" className="hover:text-[#0F766E] transition-colors">
              Family View
            </Link>
            <Link href="/dashboard/caretaker?demo=true" className="hover:text-[#0F766E] transition-colors">
              Caretaker View
            </Link>
            <Link href="/join" className="hover:text-[#0F766E] transition-colors">
              Passcode Join
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
