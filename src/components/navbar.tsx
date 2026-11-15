"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HeartHandshake,
  Shield,
  User,
  Users,
  Stethoscope,
  Menu,
  X,
  ArrowRight,
} from "lucide-react";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#E8E2D9] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1E3A2F] rounded-xl p-1">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A2F] text-white flex items-center justify-center shadow-xs group-hover:bg-[#162E25] transition-colors">
            <HeartHandshake className="w-7 h-7 text-[#EBF2EE]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black tracking-tight text-[#1E3A2F]">VATSALYA</span>
              <span className="text-lg font-bold text-[#607B6E] tracking-normal font-serif">वात्सल्य</span>
            </div>
            <p className="text-xs text-[#5C6460] font-medium tracking-wide">Care beyond generations</p>
          </div>
        </Link>

        {/* Desktop Navigation: Clearly Labeled Demo Sandbox for Hackathon Judges */}
        <nav aria-label="Demo Role Navigation" className="hidden lg:flex items-center gap-1 bg-[#F3EDE5] p-1.5 rounded-full border border-[#E8E2D9]">
          <span className="text-[10px] uppercase font-bold text-[#0F766E] px-2.5 tracking-wider">
            Demo Sandbox:
          </span>
          <Link
            href="/dashboard/elderly"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
              pathname === "/dashboard/elderly"
                ? "bg-white text-[#1C1917] shadow-xs"
                : "text-[#57534E] hover:text-[#1C1917] hover:bg-white/80"
            }`}
          >
            <User className="w-3.5 h-3.5 text-[#0F766E]" />
            Elderly
          </Link>
          <Link
            href="/dashboard/family"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
              pathname === "/dashboard/family"
                ? "bg-white text-[#1C1917] shadow-xs"
                : "text-[#57534E] hover:text-[#1C1917] hover:bg-white/80"
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#0F766E]" />
            Family
          </Link>
          <Link
            href="/dashboard/caretaker"
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full transition-all ${
              pathname === "/dashboard/caretaker"
                ? "bg-white text-[#1C1917] shadow-xs"
                : "text-[#57534E] hover:text-[#1C1917] hover:bg-white/80"
            }`}
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#0F766E]" />
            Caretaker
          </Link>
        </nav>

        {/* Primary Desktop Actions */}
        <div className="hidden sm:flex items-center gap-3">
          <Link
            href="/join"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-[#1C1917] bg-white border border-[#E8E2D9] rounded-xl hover:border-[#0F766E] hover:bg-[#FAF8F5] transition-all shadow-xs"
          >
            <Shield className="w-4 h-4 text-[#0F766E]" />
            Passcode Join
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-semibold text-[#1C1917] hover:text-[#0F766E] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold text-white bg-[#0F766E] rounded-xl hover:bg-[#0D655E] transition-all shadow-xs active:scale-95"
          >
            <span>Start a Care Profile</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center gap-2">
          <Link
            href="/join"
            className="px-3 py-1.5 text-xs font-bold text-[#1E3A2F] bg-white border border-[#EFECE6] rounded-lg"
          >
            Passcode
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#1E3A2F] rounded-xl border border-[#EFECE6] bg-white hover:bg-[#FAF8F5]"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="sm:hidden border-b border-[#EFECE6] bg-[#FDFBF7] px-4 pt-3 pb-6 space-y-4 shadow-lg animate-in slide-in-from-top duration-200">
          <div className="p-3 bg-[#EBF2EE] rounded-2xl border border-[#D5E2D9] space-y-2">
            <span className="text-[11px] font-bold text-[#607B6E] uppercase tracking-wider block">
              User Experiences
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              <Link
                href="/dashboard/elderly"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white text-sm font-bold text-[#1E3A2F]"
              >
                <User className="w-4 h-4 text-[#607B6E]" />
                Elderly Mode (Appaji)
              </Link>
              <Link
                href="/dashboard/family"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white text-sm font-bold text-[#1E3A2F]"
              >
                <Users className="w-4 h-4 text-[#607B6E]" />
                Family Member Mode (Priya)
              </Link>
              <Link
                href="/dashboard/caretaker"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 p-2.5 rounded-xl bg-white text-sm font-bold text-[#1E3A2F]"
              >
                <Stethoscope className="w-4 h-4 text-[#607B6E]" />
                Caretaker Mode (Ramesh)
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-center text-sm font-bold text-[#1E3A2F] bg-white border border-[#EFECE6] rounded-xl"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="py-3 text-center text-sm font-bold text-white bg-[#0F766E] rounded-xl shadow-xs"
            >
              Start a Care Profile
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
