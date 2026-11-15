import Link from "next/link";
import { HeartHandshake, Shield, User, Users, Stethoscope } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-[#FDFBF7]/95 backdrop-blur-md border-b border-[#EFECE6]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Identity */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A2F] text-white flex items-center justify-center shadow-sm group-hover:bg-[#162E25] transition-colors">
            <HeartHandshake className="w-7 h-7 text-[#EBF2EE]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold tracking-tight text-[#1E3A2F]">VATSALYA</span>
              <span className="text-lg font-medium text-[#607B6E] tracking-normal font-serif">वात्सल्य</span>
            </div>
            <p className="text-xs text-[#5C6460] font-medium tracking-wide">Care beyond generations</p>
          </div>
        </Link>

        {/* Role Demo Jump Links */}
        <nav className="hidden md:flex items-center gap-2 bg-[#EBF2EE] p-1.5 rounded-full border border-[#D5E2D9]">
          <Link
            href="/dashboard/elderly"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1E3A2F] rounded-full hover:bg-white transition-all shadow-none hover:shadow-xs"
          >
            <User className="w-3.5 h-3.5 text-[#607B6E]" />
            Elderly Mode
          </Link>
          <Link
            href="/dashboard/family"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1E3A2F] rounded-full hover:bg-white transition-all shadow-none hover:shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-[#607B6E]" />
            Family Mode
          </Link>
          <Link
            href="/dashboard/caretaker"
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#1E3A2F] rounded-full hover:bg-white transition-all shadow-none hover:shadow-xs"
          >
            <Stethoscope className="w-3.5 h-3.5 text-[#607B6E]" />
            Caretaker Mode
          </Link>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Link
            href="/join"
            className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-[#1E3A2F] bg-white border border-[#EFECE6] rounded-xl hover:border-[#607B6E] transition-colors"
          >
            <Shield className="w-4 h-4 text-[#607B6E]" />
            Enter Passcode
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-[#1E3A2F] hover:text-[#162E25] transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-[#1E3A2F] rounded-xl hover:bg-[#162E25] transition-all shadow-xs"
          >
            Get Started
          </Link>
        </div>
      </div>
    </header>
  );
}
