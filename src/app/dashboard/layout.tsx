"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  HeartHandshake,
  User,
  Users,
  Stethoscope,
  ArrowLeft,
  LogOut,
  FileText,
  KeyRound,
  PlusCircle,
  Pill,
  Bell,
  Menu,
  X,
  ShieldCheck,
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleSignOut = async () => {
    await signOutUser();
    router.push("/login");
  };

  const navLinks = [
    {
      name: "Dashboard Overview",
      href: pathname.startsWith("/dashboard/elderly")
        ? "/dashboard/elderly"
        : pathname.startsWith("/dashboard/caretaker")
        ? "/dashboard/caretaker"
        : "/dashboard/family",
      icon: Users,
    },
    {
      name: "Medications & Schedules",
      href: "/dashboard/medications",
      icon: Pill,
    },
    {
      name: "Clinical Health Record",
      href: "/dashboard/profile",
      icon: FileText,
    },
    {
      name: "Members & Passcodes",
      href: "/dashboard/members",
      icon: KeyRound,
    },
    {
      name: "Alerts & Escalation",
      href: "/dashboard/settings/notifications",
      icon: Bell,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFBF7] text-[#1F2421]">
      {/* Top Application Bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#EFECE6] shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Active Profile Context */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center">
                <HeartHandshake className="w-5 h-5 text-[#EBF2EE]" />
              </div>
              <span className="font-extrabold text-xl text-[#1E3A2F] tracking-tight">VATSALYA</span>
            </Link>
            <span className="hidden lg:inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F] font-bold border border-[#D5E2D9]">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
              Appaji Rao (Age 74 • Bangalore)
            </span>
          </div>

          {/* Quick Role Switcher */}
          <nav aria-label="Role Switcher" className="hidden sm:flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EFECE6]">
            <Link
              href="/dashboard/elderly"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                pathname === "/dashboard/elderly"
                  ? "bg-white text-[#1E3A2F] shadow-xs border border-[#EFECE6]"
                  : "text-[#5C6460] hover:text-[#1E3A2F]"
              }`}
            >
              <User className="w-3.5 h-3.5 text-[#607B6E]" />
              <span>Elderly View</span>
            </Link>
            <Link
              href="/dashboard/family"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                pathname === "/dashboard/family"
                  ? "bg-white text-[#1E3A2F] shadow-xs border border-[#EFECE6]"
                  : "text-[#5C6460] hover:text-[#1E3A2F]"
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#607B6E]" />
              <span>Family View</span>
            </Link>
            <Link
              href="/dashboard/caretaker"
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                pathname === "/dashboard/caretaker"
                  ? "bg-white text-[#1E3A2F] shadow-xs border border-[#EFECE6]"
                  : "text-[#5C6460] hover:text-[#1E3A2F]"
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5 text-[#607B6E]" />
              <span>Caretaker View</span>
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSignOut}
              className="text-xs font-bold text-[#5C6460] hover:text-[#1E3A2F] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#EFECE6] bg-[#FAF8F5] hover:bg-white cursor-pointer transition-colors shadow-2xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
            <Link
              href="/"
              className="text-xs font-bold text-[#5C6460] hover:text-[#1E3A2F] flex items-center gap-1 px-2.5 py-1.5 rounded-lg hover:bg-[#FAF8F5] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Exit</span>
            </Link>
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-1.5 text-[#1E3A2F] rounded-lg border border-[#EFECE6] bg-[#FAF8F5]"
              aria-label="Toggle navigation"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Sub-navigation bar for Profile & Module Management */}
        <div className="hidden md:block bg-[#FAF8F5] border-t border-[#EFECE6] px-4 sm:px-6 lg:px-8 py-2">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-xs font-bold">
            <div className="flex items-center gap-6">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`flex items-center gap-1.5 py-1 transition-colors ${
                      isActive
                        ? "text-[#1E3A2F] font-extrabold border-b-2 border-[#1E3A2F]"
                        : "text-[#5C6460] hover:text-[#1E3A2F]"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>

            <Link
              href="/onboard"
              className="inline-flex items-center gap-1.5 text-[#1E3A2F] hover:text-[#162E25] font-extrabold"
            >
              <PlusCircle className="w-3.5 h-3.5 text-[#607B6E]" />
              <span>New Healthcare Profile</span>
            </Link>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden border-t border-[#EFECE6] bg-white px-4 py-4 space-y-3 animate-in slide-in-from-top duration-150">
            <div className="grid grid-cols-3 gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EFECE6] text-center mb-3">
              <Link
                href="/dashboard/elderly"
                onClick={() => setMobileNavOpen(false)}
                className={`py-1.5 text-xs font-bold rounded-lg ${
                  pathname === "/dashboard/elderly" ? "bg-white text-[#1E3A2F] shadow-xs" : "text-[#5C6460]"
                }`}
              >
                Elderly
              </Link>
              <Link
                href="/dashboard/family"
                onClick={() => setMobileNavOpen(false)}
                className={`py-1.5 text-xs font-bold rounded-lg ${
                  pathname === "/dashboard/family" ? "bg-white text-[#1E3A2F] shadow-xs" : "text-[#5C6460]"
                }`}
              >
                Family
              </Link>
              <Link
                href="/dashboard/caretaker"
                onClick={() => setMobileNavOpen(false)}
                className={`py-1.5 text-xs font-bold rounded-lg ${
                  pathname === "/dashboard/caretaker" ? "bg-white text-[#1E3A2F] shadow-xs" : "text-[#5C6460]"
                }`}
              >
                Caretaker
              </Link>
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileNavOpen(false)}
                    className={`flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold ${
                      isActive ? "bg-[#EBF2EE] text-[#1E3A2F]" : "text-[#5C6460] hover:bg-[#FAF8F5]"
                    }`}
                  >
                    <Icon className="w-4 h-4 text-[#607B6E]" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </header>

      {/* Security & RLS Context Banner */}
      <div className="bg-[#EBF2EE] border-b border-[#D5E2D9] px-4 py-2">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs text-[#1E3A2F]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#1E3A2F] shrink-0" />
            <span>
              <strong className="font-bold">
                {configured ? "Live Database Mode:" : "Role Preview Mode:"}
              </strong>{" "}
              {configured
                ? "Protected by PostgreSQL Row Level Security (RLS) with role-based permissions."
                : "Protected by PostgreSQL Row Level Security (RLS) with role-based permissions."}
            </span>
          </div>
          <span className="hidden md:inline font-mono text-[10px] bg-white px-2 py-0.5 rounded border border-[#D5E2D9] font-bold text-[#1E3A2F]">
            RLS: has_healthcare_access()
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
