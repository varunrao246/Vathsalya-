"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  HeartHandshake,
  Mail,
  Lock,
  AlertCircle,
  ArrowRight,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import {
  signInWithEmail,
  signInWithGoogle,
  resendVerificationEmail,
  isSupabaseConfigured,
} from "@/lib/auth/auth-client";

function UrlParamsReader({
  onParams,
}: {
  onParams: (error: string | null, verified: boolean) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const verifiedParam = searchParams.get("verified") === "true";
    onParams(errorParam ? decodeURIComponent(errorParam) : null, verifiedParam);
  }, [searchParams, onParams]);

  return null;
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Resend verification state for unconfirmed users
  const [showResend, setShowResend] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendFeedback, setResendFeedback] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const handleParams = useCallback((error: string | null, verified: boolean) => {
    if (error) {
      setErrorMessage(error);
    }
    if (verified) {
      setSuccessMessage("Email confirmed successfully! You can now sign in to your account.");
    }
  }, []);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setShowResend(false);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      setSuccessMessage("Authentication successful! Loading your dashboard...");
      
      // Check user's authorized healthcare profiles
      try {
        const profileRes = await fetch("/api/healthcare-profiles");
        const profileJson = await profileRes.json();
        if (profileJson.success && Array.isArray(profileJson.data) && profileJson.data.length > 0) {
          const firstProfile = profileJson.data[0];
          const userRole = firstProfile.role;
          if (userRole === "ELDERLY") {
            router.push("/dashboard/elderly");
          } else if (userRole === "CARETAKER") {
            router.push("/dashboard/caretaker");
          } else {
            router.push("/dashboard/family");
          }
        } else {
          router.push("/onboard");
        }
      } catch {
        router.push("/dashboard/family");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setErrorMessage(msg);

      if (msg.toLowerCase().includes("not verified") || msg.toLowerCase().includes("not confirmed")) {
        setShowResend(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      setErrorMessage(
        err instanceof Error ? err.message : "Google sign-in could not be initiated."
      );
      setGoogleLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email || resendCooldown > 0 || resending) return;
    setResending(true);
    setResendFeedback(null);

    try {
      await resendVerificationEmail(email);
      setResendFeedback("Verification link re-sent! Please check your inbox and spam folder.");
      setResendCooldown(60);
    } catch (err: unknown) {
      setResendFeedback(
        err instanceof Error ? err.message : "Could not resend email right now. Please try again shortly."
      );
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      {/* Dynamic query param parser isolated inside Suspense */}
      <Suspense fallback={null}>
        <UrlParamsReader onParams={handleParams} />
      </Suspense>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-[#0F766E] text-white flex items-center justify-center shadow-xs">
            <HeartHandshake className="w-7 h-7 text-[#FAF8F5]" />
          </div>
          <span className="text-2xl font-black tracking-tight text-[#1C1917]">VATSALYA</span>
          <span className="text-lg font-bold text-[#0F766E] font-serif">वात्सल्य</span>
        </Link>
        <h1 className="text-center text-3xl font-black tracking-tight text-[#1C1917]">
          Welcome Back
        </h1>
        <p className="mt-2 text-center text-sm text-[#57534E]">
          Sign in to access your healthcare profile or manage your loved one&apos;s care.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-[#E8E2D9] sm:rounded-3xl sm:px-10">
          {!configured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-0.5">Live Supabase Credentials Pending</span>
                Live authentication connects to Supabase Auth. Set <code className="bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code>.
              </div>
            </div>
          )}

          {/* Google OAuth Sign-In Option */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading || googleLoading}
            className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-[#1C1917] bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] transition-all shadow-xs flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-50 cursor-pointer mb-5"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-[#0F766E]" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? "Connecting to Google..." : "Continue with Google"}</span>
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[#E8E2D9]" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-[#57534E] font-bold tracking-wider">
                or sign in with email
              </span>
            </div>
          </div>

          {errorMessage && (
            <div
              className={`mb-5 p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2.5 ${errorMessage.toLowerCase().includes("quota") ||
                errorMessage.toLowerCase().includes("rate limit")
                ? "bg-amber-50 border border-amber-200 text-amber-900"
                : "bg-rose-50 border border-rose-200 text-rose-800"
                }`}
            >
              <AlertCircle
                className={`w-4 h-4 shrink-0 mt-0.5 ${errorMessage.toLowerCase().includes("quota") ||
                  errorMessage.toLowerCase().includes("rate limit")
                  ? "text-amber-700"
                  : "text-rose-600"
                  }`}
              />
              <div className="leading-relaxed space-y-1.5 flex-1">
                <span>{errorMessage}</span>
                {(errorMessage.toLowerCase().includes("quota") ||
                  errorMessage.toLowerCase().includes("rate limit")) && (
                    <p className="text-[11px] font-normal text-amber-800 mt-1">
                      Supabase&apos;s free built-in email provider has a strict limit of 3–4 emails per hour. You can immediately evaluate all features using our{" "}
                      <Link
                        href="/dashboard/family"
                        className="underline font-bold text-[#0F766E] hover:text-[#0D655E]"
                      >
                        Demo Sandbox
                      </Link>.
                    </p>
                  )}
                {showResend && (
                  <div className="mt-2.5 pt-2 border-t border-rose-200/60">
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendCooldown > 0 || resending}
                      className="text-xs font-bold text-[#0F766E] underline hover:text-[#0D655E] flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${resending ? "animate-spin" : ""}`} />
                      <span>
                        {resendCooldown > 0
                          ? `Resend available in ${resendCooldown}s`
                          : resending
                            ? "Sending..."
                            : "Resend Verification Email to this address"}
                      </span>
                    </button>
                    {resendFeedback && (
                      <p className="mt-1 text-[11px] text-emerald-800 font-bold">{resendFeedback}</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {successMessage && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMessage}</span>
            </div>
          )}

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                Email Address
              </label>
              <div className="mt-1 relative">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#1C1917] placeholder-[#57534E]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-sm"
                />
                <Mail className="w-5 h-5 text-[#57534E] absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-xs font-bold text-[#1C1917] uppercase tracking-wider">
                  Password
                </label>
                <Link href="/join" className="text-xs font-bold text-[#0F766E] hover:underline">
                  Have a passcode?
                </Link>
              </div>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 rounded-xl border border-[#E8E2D9] bg-[#FAF8F5] text-[#1C1917] placeholder-[#57534E]/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F766E] text-sm"
                />
                <Lock className="w-5 h-5 text-[#57534E] absolute right-3.5 top-3" />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Demo Access Box for Hackathon Reviewers */}
          <div className="mt-6 pt-5 border-t border-[#E8E2D9] text-center">
            <span className="text-[11px] font-bold text-[#57534E] uppercase tracking-wider block mb-2">
            </span>
            <div className="p-3 rounded-2xl bg-[#F3EDE5] border border-[#E8E2D9] text-xs text-[#1C1917]">
              <div className="flex items-center justify-center gap-1.5 font-bold text-[#0F766E] mb-1">
                <Sparkles className="w-3.5 h-3.5 text-[#0F766E]" />
                <span>Explore Demo (Sample Data)</span>
              </div>
              <p className="text-[11px] text-[#57534E] mb-2 leading-relaxed">
                Test the platform without signing in using pre-configured sample profiles:
              </p>
              <div className="flex items-center justify-center gap-2 font-semibold">
                <Link
                  href="/dashboard/elderly?demo=true"
                  className="px-2.5 py-1 rounded-lg bg-white text-[#1C1917] hover:text-[#0F766E] border border-[#E8E2D9] shadow-2xs"
                >
                  Elderly
                </Link>
                <Link
                  href="/dashboard/family?demo=true"
                  className="px-2.5 py-1 rounded-lg bg-white text-[#1C1917] hover:text-[#0F766E] border border-[#E8E2D9] shadow-2xs"
                >
                  Family
                </Link>
                <Link
                  href="/dashboard/caretaker?demo=true"
                  className="px-2.5 py-1 rounded-lg bg-white text-[#1C1917] hover:text-[#0F766E] border border-[#E8E2D9] shadow-2xs"
                >
                  Caretaker
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-[#57534E]">
            <p>
              Don&apos;t have an account?{" "}
              <Link href="/register" className="font-bold text-[#0F766E] hover:underline">
                Create one now
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
