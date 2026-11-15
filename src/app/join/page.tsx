"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { HeartHandshake, ArrowLeft, KeyRound, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { isSupabaseConfigured } from "@/lib/auth/auth-client";

export default function JoinProfilePage() {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    displayName: string;
    assignedRole: string;
    healthcareProfileId: string;
  } | null>(null);

  const configured = isSupabaseConfigured();

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessData(null);
    setLoading(true);

    try {
      const res = await fetch("/api/profile-access/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 401) {
          throw new Error("You must be signed in to join a profile. Please sign in or register first.");
        }
        throw new Error(json.error?.message || "Failed to redeem passcode.");
      }

      setSuccessData(json.data);
      setTimeout(() => {
        const dest = json.data.assignedRole === "CARETAKER" ? "/dashboard/caretaker" : "/dashboard/family";
        router.push(dest);
      }, 1500);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error redeeming passcode.");
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
          Enter Access Passcode
        </h1>
        <p className="mt-2 text-center text-sm text-[#5C6460]">
          Enter the secure 6-digit passcode provided by your family member or healthcare administrator.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xs border border-[#EFECE6] sm:rounded-3xl sm:px-10">
          {!configured && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 leading-relaxed">
                <span className="font-bold block mb-0.5">Database Connection Notice</span>
                Passcode redemption checks against the live <code className="bg-amber-100 px-1 py-0.5 rounded">profile_access_invitations</code> table. Provide Supabase credentials in <code className="bg-amber-100 px-1 py-0.5 rounded">.env.local</code> to activate live redemption.
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-800 font-medium">
              {errorMessage}
            </div>
          )}

          {successData && (
            <div className="mb-5 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
              <span className="font-bold block text-sm mb-1 text-emerald-800">
                Joined Successfully!
              </span>
              Linked to <span className="font-bold">{successData.displayName}</span> as <span className="font-bold">{successData.assignedRole}</span>. Redirecting...
            </div>
          )}

          <form className="space-y-6" onSubmit={handleRedeem}>
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
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  placeholder="8 4 9 2 0 1"
                  required
                  className="w-full max-w-xs text-center tracking-[0.5em] font-mono text-2xl py-3 px-4 rounded-2xl border-2 border-[#1E3A2F] bg-[#FDFBF7] text-[#1E3A2F] focus:bg-white"
                />
              </div>
              <p className="mt-2 text-center text-xs text-[#5C6460]">
                Passcodes are single-use, rate-limited, and automatically expire 48 hours after generation.
              </p>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || passcode.length < 6}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl text-sm font-semibold text-white bg-[#1E3A2F] hover:bg-[#162E25] transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Verifying Passcode...
                  </>
                ) : (
                  <>
                    <KeyRound className="w-4 h-4" />
                    Redeem Passcode &amp; Join
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-6 pt-6 border-t border-[#EFECE6] text-xs text-[#5C6460] space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E3A2F]" />
              <span>Role-calibrated permissions enforced through PostgreSQL RLS</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#1E3A2F]" />
              <span>Immutable activity audit logging for every access</span>
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
