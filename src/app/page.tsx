import Link from "next/link";
import { Navbar } from "@/components/navbar";
import {
  Clock,
  ShieldCheck,
  Send,
  Smartphone,
  Mail,
  Heart,
  ArrowRight,
  Sparkles,
  User,
  Users,
  Stethoscope,
  Calendar,
  Lock,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#EBF2EE] border border-[#D5E2D9] text-[#1E3A2F] text-sm font-semibold mb-6">
            <Sparkles className="w-4 h-4 text-[#607B6E]" />
            <span>वात्सल्य — Tender affection and compassionate healthcare</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-[#1E3A2F] leading-tight sm:leading-none">
            Care beyond generations.
          </h1>

          <p className="mt-6 text-xl text-[#5C6460] leading-relaxed">
            Technology should never make older adults feel dependent. VATSALYA preserves dignity and
            independence through high-contrast simplicity, while keeping trusted family members and
            caretakers seamlessly connected.
          </p>

          {/* Action CTAs */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-white bg-[#1E3A2F] hover:bg-[#162E25] rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
            >
              Start Free Setup
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/join"
              className="w-full sm:w-auto px-8 py-4 text-base font-semibold text-[#1E3A2F] bg-white hover:bg-[#F7F5F0] border-2 border-[#EFECE6] rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <Lock className="w-5 h-5 text-[#607B6E]" />
              Enter 6-Digit Passcode
            </Link>
          </div>

          {/* Role Preview Bar for Judges */}
          <div className="mt-8 pt-8 border-t border-[#EFECE6] text-left">
            <p className="text-xs font-bold text-[#607B6E] uppercase tracking-wider text-center mb-4">
              Explore User Role Experiences:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Link
                href="/dashboard/elderly"
                className="p-4 rounded-xl bg-white border border-[#EFECE6] hover:border-[#607B6E] transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] group-hover:bg-[#1E3A2F] group-hover:text-white transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E3A2F]">Elderly View</h2>
                  <p className="text-xs text-[#5C6460]">Large font, 1-tap confirmation</p>
                </div>
              </Link>

              <Link
                href="/dashboard/family"
                className="p-4 rounded-xl bg-white border border-[#EFECE6] hover:border-[#607B6E] transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] group-hover:bg-[#1E3A2F] group-hover:text-white transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E3A2F]">Family View</h2>
                  <p className="text-xs text-[#5C6460]">Adherence trends & AI summaries</p>
                </div>
              </Link>

              <Link
                href="/dashboard/caretaker"
                className="p-4 rounded-xl bg-white border border-[#EFECE6] hover:border-[#607B6E] transition-all flex items-center gap-3 group"
              >
                <div className="w-10 h-10 rounded-lg bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] group-hover:bg-[#1E3A2F] group-hover:text-white transition-colors">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#1E3A2F]">Caretaker View</h2>
                  <p className="text-xs text-[#5C6460]">Daily checklist & shift memos</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Official Problem Statement Alignment Section */}
      <section className="py-16 bg-white border-y border-[#EFECE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A2F]">
              Designed for Clinical Adherence & Dignity
            </h2>
            <p className="mt-3 text-base text-[#5C6460]">
              Built strictly around the official challenge criteria: medication management, doctor
              appointments, and multi-role collaborative access.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] hover:shadow-xs transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] mb-6">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E3A2F]">
                Deterministic Medication Engine
              </h3>
              <p className="mt-3 text-sm text-[#5C6460] leading-relaxed">
                Separated medication master records and multi-dose daily slots. Clear statuses:
                Upcoming, Due, Taken, Overdue, and Unconfirmed. Zero guesswork.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] hover:shadow-xs transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] mb-6">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E3A2F]">
                Doctor Appointments & Follow-ups
              </h3>
              <p className="mt-3 text-sm text-[#5C6460] leading-relaxed">
                Track clinical consultations, clinic locations, diagnostic notes, and assign a
                family companion so no elder ever visits the doctor alone.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] hover:shadow-xs transition-shadow">
              <div className="w-12 h-12 rounded-xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] mb-6">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-[#1E3A2F]">
                Secure Passcode-Based Access
              </h3>
              <p className="mt-3 text-sm text-[#5C6460] leading-relaxed">
                Time-limited 6-digit access codes allow children and trusted nurses to link to a
                profile without sharing passwords or compromising elderly autonomy.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Notification Delivery Channels Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F] text-xs font-bold uppercase tracking-wider mb-3">
            Unified Notification Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1E3A2F]">
            Three Channels. One Truth. Zero Duplicates.
          </h2>
          <p className="mt-3 text-base text-[#5C6460]">
            Every reminder and escalation is powered by a shared backend scheduler with idempotent
            deduplication keys.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Channel A: Android Push */}
          <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#1E3A2F]">Android App (FCM)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-[#EBF2EE] text-[#1E3A2F] font-semibold">
                  API Ready
                </span>
              </div>
              <p className="text-sm text-[#5C6460] leading-relaxed">
                Native push notification foundations designed with Firebase Cloud Messaging. Device
                registration and token revocation APIs built-in.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-[#EFECE6] text-xs text-[#607B6E] font-medium">
              High-priority background alerts & lock-screen actions
            </div>
          </div>

          {/* Channel B: Telegram Bot */}
          <div className="p-8 rounded-3xl bg-white border-2 border-[#1E3A2F] shadow-sm flex flex-col justify-between relative">
            <div className="absolute -top-3.5 left-8 px-3 py-0.5 rounded-full bg-[#1E3A2F] text-white text-xs font-bold uppercase tracking-wider">
              Interactive Bot
            </div>
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#1E3A2F] flex items-center justify-center text-white mb-6">
                <Send className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#1E3A2F]">Telegram Bot</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Live Webhook
                </span>
              </div>
              <p className="text-sm text-[#5C6460] leading-relaxed">
                Two-way conversational reminders. Tap <span className="font-semibold text-[#1E3A2F]">[ Taken ]</span> directly in Telegram to instantly update the medical profile.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-[#EFECE6] text-xs text-[#607B6E] font-medium">
              Actions: Taken | Remind in 15m | Need Help
            </div>
          </div>

          {/* Channel C: Resend Email */}
          <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] mb-6">
                <Mail className="w-6 h-6" />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-xl font-bold text-[#1E3A2F]">Email (Resend)</h3>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                  Transactional
                </span>
              </div>
              <p className="text-sm text-[#5C6460] leading-relaxed">
                Accessible, high-contrast HTML emails for upcoming medicines, overdue alerts, and
                appointment notifications for family members.
              </p>
            </div>
            <div className="mt-6 pt-6 border-t border-[#EFECE6] text-xs text-[#607B6E] font-medium">
              Idempotent delivery preventing duplicate emails
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto py-12 bg-white border-t border-[#EFECE6]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center">
              <Heart className="w-4 h-4 text-[#EBF2EE]" />
            </div>
            <span className="text-lg font-bold text-[#1E3A2F]">VATSALYA</span>
            <span className="text-sm font-medium text-[#607B6E]">वात्सल्य</span>
          </div>
          <p className="text-xs text-[#5C6460]">
            VATSALYA Healthcare Platform. Built for the Catalyst Innovation Hackathon.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-[#1E3A2F]">
            <Link href="/api/health" className="hover:underline">System Health</Link>
            <Link href="/login" className="hover:underline">Sign In</Link>
            <Link href="/register" className="hover:underline">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
