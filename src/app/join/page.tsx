"use client";

import Link from "next/link";
import { HeartHandshake, ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";

export default function JoinProfilePage() {
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
          Enter Access Passcode
        </h1>
        <p className="mt-2 text-center text-sm text-[#5C6460]">
          Enter the secure 6-digit passcode provided by your family member or healthcare administrator.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#EFECE6] sm:rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="passcode" className="block text-center text-sm font-semibold text-[#1F2421] mb-2">
                6-Digit Invitation Code
              </label>
              <div className="flex justify-center">
                <input
                  id="passcode"
                  name="passcode"
                  type="text"
                  maxLength={6}
                  placeholder="8 4 9 2 0 1"
                  required
                  className="w-full max-w-xs text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 rounded-2xl border-2 border-[#1E3A2F] bg-[#FDFBF7] text-[#1E3A2F] focus:bg-white"
                />
              </div>
              <p className="mt-2 text-center text-xs text-[#5C6460]">
                Passcodes are single-use and automatically expire 48 hours after generation.
              </p>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#1E3A2F] hover:bg-[#162E25] transition-colors shadow-xs"
              >
                <KeyRound className="w-4 h-4" />
                Redeem Passcode & Join
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#EFECE6] text-xs text-[#5C6460] space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E3A2F]" />
              <span>Grants role-calibrated access to medication schedules</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E3A2F]" />
              <span>Full audit logging of all member actions</span>
            </div>
          </div>

          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E3A2F] hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
