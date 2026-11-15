"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  Shield,
  ArrowRight,
  Loader2,
  AlertCircle,
  MailCheck,
  RefreshCw,
  CheckCircle2,
} from "lucide-react";
import {
  signUpWithEmail,
  resendVerificationEmail,
  isSupabaseConfigured,
} from "@/lib/auth/auth-client";

export default function RegisterPage() {
  const router = useRouter();
  const [setupFor, setSetupFor] = useState<"myself" | "parent">("myself");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [language, setLanguage] = useState("kn");

  // Interaction & Submission States
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Email Verification Screen State
  const [requiresVerification, setRequiresVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  // Cooldown countdown effect
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Client-side validations
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setLoading(true);

    try {
      const data = await signUpWithEmail(email, password, {
        fullName,
        phone,
        preferredLanguage: language,
      });

      // If email verification is enabled on Supabase, session is null
      if (data && !data.session) {
        setRequiresVerification(true);
        setResendCooldown(60);
      } else {
        // If email verification was disabled, session exists -> navigate to onboarding
        router.push("/onboard");
      }
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || resending || !email) return;
    setResending(true);
    setResendFeedback(null);

    try {
      await resendVerificationEmail(email);
      setResendFeedback("Verification email re-sent! Please check your inbox and spam folder.");
      setResendCooldown(60);
    } catch (err: unknown) {
      setResendFeedback(
        err instanceof Error ? err.message : "Could not resend email right now. Please wait a moment."
      );
    } finally {
      setResending(false);
    }
  };

  // State 1: Verification Required Screen
  if (requiresVerification) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAF8F5]">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Link href="/" className="flex items-center justify-center gap-2 mb-6 group">
            <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-7 h-7 text-[#FAF8F5]" />
            </div>
            <span className="text-2xl font-black tracking-tight text-[#1C1917]">VATSALYA</span>
            <span className="text-lg font-bold text-[#0F766E] font-serif">वात्सल्य</span>
          </Link>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
          <div className="bg-white py-10 px-6 sm:px-10 shadow-sm border border-[#E8E2D9] rounded-3xl text-center space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center mx-auto shadow-xs">
              <MailCheck className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C1917]">
                Account created successfully!
              </h1>
              <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                Check your inbox and confirm your email address. Once verified, return here and log in.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-left">
              <span className="text-xs font-bold text-[#57534E] uppercase tracking-wider block">
                Verification sent to:
              </span>
              <p className="mt-1 text-sm font-extrabold text-[#1C1917] font-mono break-all">
                {email}
              </p>
            </div>

            {resendFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 text-left ${
                  resendFeedback.includes("re-sent")
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-amber-50 text-amber-800 border border-amber-200"
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{resendFeedback}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Link
                href="/login"
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors shadow-xs flex items-center justify-center gap-2"
              >
                <span>Return to Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || resending}
                className="w-full py-3 px-4 rounded-xl text-xs font-bold text-[#1C1917] bg-[#F3EDE5] hover:bg-[#E8E2D9] transition-colors border border-[#E8E2D9] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${resending ? "animate-spin" : ""}`} />
                <span>
                  {resendCooldown > 0
                    ? `Resend available in ${resendCooldown}s`
                    : resending
                    ? "Sending..."
                    : "Resend Verification Email"}
                </span>
              </button>
            </div>

            <p className="text-xs text-[#57534E] pt-2 border-t border-[#E8E2D9]">
              Did not receive the email? Check your spam folder or verify that the address entered is correct.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Standard Registration Form
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-7 h-7 text-[#FAF8F5]" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#1C1917]">VATSALYA</span>
          <span className="text-lg font-bold text-[#0F766E] font-serif">वात्सल्य</span>
        </Link>
        <h1 className="text-center text-3xl font-black tracking-tight text-[#1C1917]">
          Create Your Account
        </h1>
        <p className="mt-2 text-center text-sm text-[#57534E]">
          Begin your journey towards dignified, collaborative healthcare management.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E8E2D9] sm:rounded-3xl sm:px-10">
          {!configured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-0.5">Live Supabase Credentials Pending</span>
                Live registration connects to Supabase Auth. Set <code className="bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code>.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-relaxed">
                <span>{errorMessage}</span>
                {errorMessage.includes("already exists") && (
                  <Link href="/login" className="block mt-1 underline font-bold text-rose-900">
                    Sign in to your account &rarr;
                  </Link>
                )}
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRegister}>
            {/* Account Intent Selection */}
            <div>
              <label className="block text-sm font-bold text-[#1C1917] mb-2">
                Who are you setting this up for?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setSetupFor("myself")}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    setupFor === "myself"
                      ? "border-[#0F766E] bg-[#F3EDE5]/60"
                      : "border-[#E8E2D9] bg-[#FAF8F5]"
                  }`}
                >
                  <input
                    type="radio"
                    name="setupFor"
                    checked={setupFor === "myself"}
                    onChange={() => setSetupFor("myself")}
                    className="mt-1 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <div>
                    <span className="text-sm font-bold text-[#1C1917] block">For Myself</span>
                    <span className="text-xs text-[#57534E]">
                      I am an older adult managing my daily health routines.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setSetupFor("parent")}
                  className={`p-4 rounded-2xl border-2 flex items-start gap-3 cursor-pointer transition-all ${
                    setupFor === "parent"
                      ? "border-[#0F766E] bg-[#F3EDE5]/60"
                      : "border-[#E8E2D9] bg-[#FAF8F5]"
                  }`}
                >
                  <input
                    type="radio"
                    name="setupFor"
                    checked={setupFor === "parent"}
                    onChange={() => setSetupFor("parent")}
                    className="mt-1 text-[#0F766E] focus:ring-[#0F766E]"
                  />
                  <div>
                    <span className="text-sm font-bold text-[#1C1917] block">For My Parent</span>
                    <span className="text-xs text-[#57534E]">
                      I am a family member managing care on their behalf.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Core Registration Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="fullName" className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider">
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
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#1C1917] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider">
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
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#1C1917] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider">
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
                className="mt-1 w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#1C1917] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="password" className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                  Password (min 8 chars)
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#1C1917] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
                />
              </div>

              <div>
                <label htmlFor="language" className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                  Preferred Language
                </label>
                <select
                  id="language"
                  name="language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#1C1917] text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E]"
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
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Registration</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#E8E2D9] flex flex-col sm:flex-row items-center justify-between text-xs text-[#57534E] gap-3">
            <Link href="/join" className="font-bold text-[#0F766E] hover:underline flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-[#0F766E]" />
              <span>Have a 6-digit invitation passcode?</span>
            </Link>
            <p>
              Already registered?{" "}
              <Link href="/login" className="font-bold text-[#0F766E] hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
