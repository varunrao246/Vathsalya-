"use client";

import Link from "next/link";
import { HeartHandshake, Shield, ArrowRight } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FDFBF7]">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A2F] text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-7 h-7 text-[#EBF2EE]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#1E3A2F]">VATSALYA</span>
          <span className="text-lg font-medium text-[#607B6E]">वात्सल्य</span>
        </Link>
        <h1 className="text-center text-3xl font-bold tracking-tight text-[#1E3A2F]">
          Create Your Account
        </h1>
        <p className="mt-2 text-center text-sm text-[#5C6460]">
          Begin your journey towards dignified, collaborative healthcare management.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#EFECE6] sm:rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Account Intent / Persona Selection */}
            <div>
              <label className="block text-sm font-bold text-[#1F2421] mb-2">
                Who are you setting this up for?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="p-4 rounded-2xl border-2 border-[#1E3A2F] bg-[#EBF2EE]/50 flex items-start gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="setupFor"
                    defaultChecked
                    className="mt-1 text-[#1E3A2F] focus:ring-[#1E3A2F]"
                  />
                  <div>
                    <span className="text-sm font-bold text-[#1E3A2F] block">For Myself</span>
                    <span className="text-xs text-[#5C6460]">
                      I am an older adult managing my daily health routines.
                    </span>
                  </div>
                </label>

                <label className="p-4 rounded-2xl border border-[#EFECE6] bg-[#FDFBF7] flex items-start gap-3 cursor-pointer hover:border-[#607B6E]">
                  <input
                    type="radio"
                    name="setupFor"
                    className="mt-1 text-[#1E3A2F] focus:ring-[#1E3A2F]"
                  />
                  <div>
                    <span className="text-sm font-bold text-[#1E3A2F] block">For My Parent</span>
                    <span className="text-xs text-[#5C6460]">
                      I am a family member managing care on their behalf.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Core Registration Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-[#1F2421]">
                  Full Name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  placeholder="Appaji Rao / Priya Sharma"
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-sm focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-[#1F2421]">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-sm focus:bg-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-[#1F2421]">
                Email Address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="name@example.com"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-sm focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-[#1F2421]">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-sm focus:bg-white"
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-sm font-semibold text-[#1F2421]">
                  Preferred Language
                </label>
                <select
                  id="language"
                  name="language"
                  defaultValue="kn"
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-sm focus:bg-white"
                >
                  <option value="kn">ಕನ್ನಡ (Kannada)</option>
                  <option value="en">English</option>
                  <option value="hi">हिंदी (Hindi)</option>
                </select>
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#1E3A2F] hover:bg-[#162E25] transition-colors shadow-xs"
              >
                Complete Registration
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#EFECE6] flex flex-col sm:flex-row items-center justify-between text-xs text-[#5C6460] gap-3">
            <Link href="/join" className="font-semibold text-[#1E3A2F] hover:underline flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#607B6E]" />
              Have a 6-digit invitation passcode?
            </Link>
            <p>
              Already registered?{" "}
              <Link href="/login" className="font-semibold text-[#1E3A2F] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
