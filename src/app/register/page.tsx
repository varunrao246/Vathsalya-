"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartHandshake, Shield, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { signUpWithEmail, isSupabaseConfigured } from "@/lib/auth/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [setupFor, setSetupFor] = useState<"myself" | "parent">("myself");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("kn");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await signUpWithEmail(email, password, {
        fullName,
        phone,
        preferredLanguage: language,
      });

      setSuccessMessage("Account created successfully! Check your email for confirmation link.");
      setTimeout(() => {
        router.push(setupFor === "myself" ? "/dashboard/elderly" : "/dashboard/family");
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FDFBF7]">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-[#1E3A2F] text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-7 h-7 text-[#EBF2EE]" />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[#1E3A2F]">VATSALYA</span>
          <span className="text-lg font-medium text-[#607B6E]">वात्सल್ಯ</span>
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
          {!configured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-0.5">Live Supabase Credentials Pending</span>
                Live registration connects to Supabase Auth. Set <code className="bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code> to activate live user registration.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold">
              {successMessage}
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            {/* Account Intent Selection */}
            <div>
              <label className="block text-sm font-bold text-[#1F2421] mb-2">
                Who are you setting this up for?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setSetupFor("myself")}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    setupFor === "myself"
                      ? "border-[#1E3A2F] bg-[#EBF2EE]/50"
                      : "border-[#EFECE6] bg-[#FDFBF7]"
                  }`}
                >
                  <input
                    type="radio"
                    name="setupFor"
                    checked={setupFor === "myself"}
                    onChange={() => setSetupFor("myself")}
                    className="mt-1 text-[#1E3A2F] focus:ring-[#1E3A2F]"
                  />
                  <div>
                    <span className="text-sm font-bold text-[#1E3A2F] block">For Myself</span>
                    <span className="text-xs text-[#5C6460]">
                      I am an older adult managing my daily health routines.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setSetupFor("parent")}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    setupFor === "parent"
                      ? "border-[#1E3A2F] bg-[#EBF2EE]/50"
                      : "border-[#EFECE6] bg-[#FDFBF7]"
                  }`}
                >
                  <input
                    type="radio"
                    name="setupFor"
                    checked={setupFor === "parent"}
                    onChange={() => setSetupFor("parent")}
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
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
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
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#1E3A2F] hover:bg-[#162E25] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Complete Registration
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
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
