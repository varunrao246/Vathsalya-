"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HeartHandshake,
  User,
  Users,
  Stethoscope,
  ArrowLeft,
  LogOut,
  Info,
  FileText,
  KeyRound,
  PlusCircle,
  Pill,
} from "lucide-react";
import { signOutUser, isSupabaseConfigured } from "@/lib/auth/auth-client";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const configured = isSupabaseConfigured();

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7]">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EFECE6] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-[#EBF2EE]" />
              </div>
              <span className="font-bold text-xl text-[#1E3A2F] tracking-tight">VATSALYA</span>
            </Link>
            <span className="hidden lg:inline-block text-xs px-2.5 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F] font-semibold">
              Profile: Appaji Rao (74, Bangalore)
            </span>
          </div>

          {/* Quick Role Switcher for Hackathon Evaluation */}
          <nav className="flex items-center gap-1 bg-[#FDFBF7] p-1 rounded-xl border border-[#EFECE6]">
            <Link
              href="/dashboard/elderly"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                pathname === "/dashboard/elderly"
                  ? "bg-white text-[#1E3A2F] shadow-xs"
                  : "text-[#5C6460] hover:text-[#1E3A2F]"
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#607B6E]" />
              <span className="hidden sm:inline">Elderly</span>
            </Link>
            <Link
              href="/dashboard/family"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                pathname === "/dashboard/family"
                  ? "bg-white text-[#1E3A2F] shadow-xs"
                  : "text-[#5C6460] hover:text-[#1E3A2F]"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#607B6E]" />
              <span className="hidden sm:inline">Family</span>
            </Link>
            <Link
              href="/dashboard/caretaker"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                pathname === "/dashboard/caretaker"
                  ? "bg-white text-[#1E3A2F] shadow-xs"
                  : "text-[#5C6460] hover:text-[#1E3A2F]"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#607B6E]" />
              <span className="hidden sm:inline">Caretaker</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-[#5C6460] hover:text-[#1E3A2F] flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#EFECE6] bg-[#FDFBF7] hover:bg-white cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
            <Link
              href="/"
              className="text-xs font-medium text-[#5C6460] hover:text-[#1E3A2F] flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exit</span>
            </Link>
          </div>
        </div>

        {/* Sub-navigation bar for Profile & Member Management */}
        <div className="bg-[#FAF8F5] border-t border-[#EFECE6] px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard/family"
                className={`hover:text-[#1E3A2F] transition-colors ${
                  pathname === "/dashboard/family" ? "text-[#1E3A2F] font-bold underline underline-offset-4" : "text-[#5C6460]"
                }`}
              >
                Dashboard Overview
              </Link>
              <Link
                href="/dashboard/medications"
                className={`flex items-center gap-1 hover:text-[#1E3A2F] transition-colors ${
                  pathname === "/dashboard/medications" ? "text-[#1E3A2F] font-bold underline underline-offset-4" : "text-[#5C6460]"
                }`}
              >
                <Pill className="w-3.5 h-3.5" />
                Medications &amp; Schedules
              </Link>
              <Link
                href="/dashboard/profile"
                className={`flex items-center gap-1 hover:text-[#1E3A2F] transition-colors ${
                  pathname === "/dashboard/profile" ? "text-[#1E3A2F] font-bold underline underline-offset-4" : "text-[#5C6460]"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                Clinical Health Record
              </Link>
              <Link
                href="/dashboard/members"
                className={`flex items-center gap-1 hover:text-[#1E3A2F] transition-colors ${
                  pathname === "/dashboard/members" ? "text-[#1E3A2F] font-bold underline underline-offset-4" : "text-[#5C6460]"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Members &amp; Passcodes
              </Link>
            </div>

            <Link
              href="/onboard"
              className="hidden sm:inline-flex items-center gap-1 text-[#1E3A2F] hover:text-[#162E25] font-bold"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#607B6E]" />
              New Healthcare Profile
            </Link>
          </div>
        </div>
      </header>

      {/* Demo Simulation Notice Banner for Hackathon Evaluators */}
      <div className="bg-[#EBF2EE] border-b border-[#D5E2D9] px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#1E3A2F]">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-[#607B6E] shrink-0" />
            <span>
              <strong className="font-semibold">
                {configured ? "Live Authenticated Mode:" : "Role Preview Mode:"}
              </strong>{" "}
              {configured
                ? "Connected to live Supabase Auth with PostgreSQL Row Level Security (RLS)."
                : "Viewing UI layout with sample healthcare profile. Live user sessions are authenticated via Supabase Auth with PostgreSQL Row Level Security (RLS)."}
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#D5E2D9]">
            RLS Policy: has_healthcare_access()
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
