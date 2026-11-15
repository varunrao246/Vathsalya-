"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function ConfirmContent() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function processVerification() {
      // 1. Inspect query parameters
      const code = searchParams.get("code");
      const token_hash = searchParams.get("token_hash");
      const type = (searchParams.get("type") as "signup" | "email" | null) || "signup";
      const queryError = searchParams.get("error");
      const queryErrorDesc = searchParams.get("error_description");

      // 2. Inspect URL hash fragments (Supabase redirect delivers #access_token=... or #error=...)
      let hashError: string | null = null;
      let hashErrorDesc: string | null = null;
      let hashAccessToken: string | null = null;

      if (typeof window !== "undefined" && window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        hashError = params.get("error");
        hashErrorDesc = params.get("error_description");
        hashAccessToken = params.get("access_token");
      }

      // Check for explicit error in query or hash
      if (queryError || hashError) {
        if (!mounted) return;
        setStatus("error");
        const raw = queryErrorDesc || hashErrorDesc || queryError || hashError;
        if (raw?.includes("expired") || raw?.includes("invalid") || raw?.includes("otp_expired")) {
          setErrorMessage(
            "This email confirmation link is invalid, has expired, or has already been used."
          );
        } else {
          setErrorMessage(raw || "This confirmation link is invalid or has expired.");
        }
        return;
      }

      const supabase = createClient();

      try {
        // Check for an unrelated existing session to avoid destroying other users' state
        const { data: initialSessionData } = await supabase.auth.getSession();
        const existingSession = initialSessionData.session;

        let confirmedEmail: string | null = null;

        // PATH A: token_hash & type (PKCE Token Hash / OTP flow)
        if (token_hash) {
          const res = await fetch("/api/auth/verify-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token_hash, type }),
          });
          const resData = await res.json();
          if (!res.ok || !resData.success) {
            if (!mounted) return;
            setStatus("error");
            const err = resData.error || "";
            if (err.includes("expired") || err.includes("invalid")) {
              setErrorMessage(
                "This email confirmation link is invalid, has expired, or has already been used."
              );
            } else {
              setErrorMessage(err || "Failed to verify email token.");
            }
            return;
          }
          confirmedEmail = resData.email;
        }
        // PATH B: code (PKCE Code Exchange flow)
        else if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            if (!mounted) return;
            setStatus("error");
            if (error.message.includes("expired") || error.message.includes("invalid")) {
              setErrorMessage(
                "This email confirmation link is invalid, has expired, or has already been used."
              );
            } else {
              setErrorMessage(error.message);
            }
            return;
          }
          confirmedEmail = data.user?.email || null;
        }
        // PATH C: access_token in hash (Default Supabase verify redirect)
        else if (hashAccessToken) {
          // Token is already verified on Supabase server before redirecting here
          const { data: userData, error: userError } = await supabase.auth.getUser(hashAccessToken);
          if (userError) {
            if (!mounted) return;
            setStatus("error");
            setErrorMessage(userError.message);
            return;
          }
          confirmedEmail = userData.user?.email || null;
        } else {
          // No parameters provided
          if (!mounted) return;
          setStatus("error");
          setErrorMessage(
            "No confirmation token or code was found in this link. If you already verified your email, please log in with your credentials."
          );
          return;
        }

        // 7. CLEAR ANY SESSION ESTABLISHED DURING VERIFICATION
        // Strictly isolate and clear the temporary verification session.
        // If an unrelated user was already logged in (different email), we do NOT disrupt their session.
        if (
          !existingSession ||
          (confirmedEmail && existingSession.user.email?.toLowerCase() === confirmedEmail.toLowerCase())
        ) {
          await supabase.auth.signOut({ scope: "local" }).catch(() => {});
          await fetch("/api/auth/clear-verification-session", { method: "POST" }).catch(() => {});
        }

        // Clean URL hash so access_token / fragments are not preserved in browser address bar
        if (typeof window !== "undefined" && window.location.hash) {
          window.history.replaceState(null, "", window.location.pathname + window.location.search);
        }

        if (!mounted) return;
        setVerifiedEmail(confirmedEmail);
        setStatus("success");
      } catch (err: unknown) {
        if (!mounted) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error
            ? err.message
            : "An unexpected error occurred during email verification."
        );
      }
    }

    processVerification();

    return () => {
      mounted = false;
    };
  }, [searchParams]);

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-[#FAF8F5]">
      {/* Brand Header */}
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
          {/* STATE 1: LOADING */}
          {status === "loading" && (
            <div className="space-y-4 py-8">
              <div className="w-16 h-16 rounded-3xl bg-[#F3EDE5] text-[#0F766E] flex items-center justify-center mx-auto shadow-xs">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <h1 className="text-xl font-black tracking-tight text-[#1C1917]">
                Verifying your email address...
              </h1>
              <p className="text-xs text-[#57534E]">
                Please wait while we confirm your credentials with VATSALYA Care.
              </p>
            </div>
          )}

          {/* STATE 2: SUCCESS */}
          {status === "success" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1C1917]">
                  Email verified successfully!
                </h1>
                <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                  Your email address is now verified. Please log in with your email and password to continue.
                </p>
              </div>

              {verifiedEmail && (
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-left">
                  <span className="text-[11px] font-bold text-[#57534E] uppercase tracking-wider block">
                    Verified Account:
                  </span>
                  <p className="mt-0.5 text-xs font-mono font-bold text-[#1C1917] break-all">
                    {verifiedEmail}
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-2xl bg-[#F3EDE5] border border-[#E8E2D9] text-xs text-[#57534E] flex items-center gap-2.5 text-left">
                <Lock className="w-4 h-4 text-[#0F766E] shrink-0" />
                <span>
                  For your safety, automatic login is disabled upon verification. Please enter your credentials to open your healthcare profile.
                </span>
              </div>

              <div className="pt-2">
                <Link
                  href="/login"
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )}

          {/* STATE 3: ERROR */}
          {status === "error" && (
            <div className="space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center mx-auto shadow-xs">
                <AlertCircle className="w-8 h-8" />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#1C1917]">
                  Verification Link Expired or Invalid
                </h1>
                <p className="mt-3 text-sm text-[#57534E] leading-relaxed">
                  {errorMessage ||
                    "This email confirmation link is invalid, has expired, or has already been used."}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#E8E2D9] text-xs text-[#57534E] leading-relaxed text-left">
                <strong className="text-[#1C1917] block mb-1">What to do next:</strong>
                <ul className="list-disc pl-4 space-y-1">
                  <li>If your account was already verified, please sign in directly below.</li>
                  <li>If this link expired, sign in or register to request a fresh confirmation email.</li>
                </ul>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  href="/login"
                  className="w-full py-3.5 px-4 rounded-xl text-sm font-bold text-white bg-[#0F766E] hover:bg-[#0D655E] transition-colors shadow-xs flex items-center justify-center gap-2"
                >
                  <span>Go to Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <Link
                  href="/register"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-[#1C1917] bg-[#F3EDE5] hover:bg-[#E8E2D9] transition-colors border border-[#E8E2D9] flex items-center justify-center gap-2"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#0F766E]" />
                  <span>Request New Link from Registration</span>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ConfirmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#FAF8F5]">
          <Loader2 className="w-8 h-8 text-[#0F766E] animate-spin" />
        </div>
      }
    >
      <ConfirmContent />
    </Suspense>
  );
}
