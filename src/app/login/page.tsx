"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartHandshake, Shield, Mail, Lock, AlertCircle, ArrowRight, Loader2 } from "lucide-react";
import { signInWithEmail, isSupabaseConfigured } from "@/lib/auth/auth-client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const configured = isSupabaseConfigured();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await signInWithEmail(email, password);
      setSuccessMessage("Authentication successful! Redirecting to dashboard...");
      setTimeout(() => {
        router.push("/dashboard/family");
      }, 1000);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.");
    } finally {
      setLoading(false);
    }
  };

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
          {/* Status banner */}
          {!configured ? (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-0.5">Live Supabase Credentials Pending</span>
                Live authentication requires <code className="bg-amber-100 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> in <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code>. You can explore our role previews below.
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 rounded-2xl bg-[#EBF2EE] border border-[#D5E2D9] flex items-start gap-3">
              <Shield className="w-5 h-5 text-[#1E3A2F] shrink-0 mt-0.5" />
              <div className="text-xs text-[#1E3A2F] leading-relaxed">
                <span className="font-bold block mb-0.5">Supabase Auth Connected</span>
                Sessions are cryptographically verified through secure HttpOnly cookies.
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

          <form className="space-y-5" onSubmit={handleLogin}>
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 border border-transparent rounded-xl shadow-xs text-sm font-semibold text-white bg-[#1E3A2F] hover:bg-[#162E25] transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Signing In...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Quick Role Preview Jump for Evaluators */}
          <div className="mt-6 pt-6 border-t border-[#EFECE6]">
            <p className="text-xs font-bold text-[#607B6E] uppercase tracking-wider text-center mb-3">
              Role Demo Previews (Offline Simulation):
            </p>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-medium">
              <Link
                href="/dashboard/elderly"
                className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EFECE6] text-[#1E3A2F] hover:bg-[#EBF2EE]"
              >
                Elderly
              </Link>
              <Link
                href="/dashboard/family"
                className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EFECE6] text-[#1E3A2F] hover:bg-[#EBF2EE]"
              >
                Family
              </Link>
              <Link
                href="/dashboard/caretaker"
                className="p-2 rounded-lg bg-[#FDFBF7] border border-[#EFECE6] text-[#1E3A2F] hover:bg-[#EBF2EE]"
              >
                Caretaker
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
