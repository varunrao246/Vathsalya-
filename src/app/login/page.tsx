"use client";

import Link from "next/link";
import { HeartHandshake, Shield, Mail, Lock } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FDFBF7]">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A2F] text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-7 h-7 text-[#EBF2EE]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#1E3A2F]">VATSALYA</span>
          <span className="text-lg font-medium text-[#607B6E]">वात्सल्य</span>
        </Link>
        <h1 className="text-center text-3xl font-bold tracking-tight text-[#1E3A2F]">
          Welcome Back
        </h1>
        <p className="mt-2 text-center text-sm text-[#5C6460]">
          Sign in to access your healthcare profile or manage your loved one&apos;s care.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#EFECE6] sm:rounded-3xl sm:px-10">
          {/* Informational banner about Supabase backend setup */}
          <div className="mb-6 p-4 rounded-2xl bg-[#EBF2EE] border border-[#D5E2D9] flex items-start gap-3">
            <Shield className="w-5 h-5 text-[#1E3A2F] shrink-0 mt-0.5" />
            <div className="text-xs text-[#1E3A2F] leading-relaxed">
              <span className="font-semibold block mb-0.5">Secure Supabase Authentication</span>
              In production, sessions are authenticated via Supabase Auth (Email / Magic Link). To preview dashboards during the hackathon, explore our role views directly below.
            </div>
          </div>

          <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1F2421]">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] placeholder-[#5C6460]/60 focus:bg-white text-sm"
                />
                <Mail className="w-5 h-5 text-[#607B6E] absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-semibold text-[#1F2421]">
                  Password
                </label>
                <a href="#" className="text-xs font-semibold text-[#607B6E] hover:underline">
                  Forgot password?
                </a>
              </div>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] placeholder-[#5C6460]/60 focus:bg-white text-sm"
                />
                <Lock className="w-5 h-5 text-[#607B6E] absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-[#1E3A2F] hover:bg-[#162E25] transition-colors"
              >
                Sign In
              </button>
            </div>
          </form>

          {/* Quick Role Preview Jump for Judges */}
          <div className="mt-6 pt-6 border-t border-[#EFECE6]">
            <p className="text-xs font-bold text-[#607B6E] uppercase tracking-wider text-center mb-3">
              Direct Role Demo Previews:
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
              <Link
                href="/dashboard/elderly"
                className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EFECE6] text-[#1E3A2F] hover:bg-[#EBF2EE]"
              >
                Elderly Mode
              </Link>
              <Link
                href="/dashboard/family"
                className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EFECE6] text-[#1E3A2F] hover:bg-[#EBF2EE]"
              >
                Family Mode
              </Link>
              <Link
                href="/dashboard/caretaker"
                className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EFECE6] text-[#1E3A2F] hover:bg-[#EBF2EE]"
              >
                Caretaker Mode
              </Link>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-[#5C6460]">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-semibold text-[#1E3A2F] hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
