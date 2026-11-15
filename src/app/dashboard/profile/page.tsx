"use client";

import Link from "next/link";
import {
  User,
  Users,
  PhoneCall,
  Stethoscope,
  Heart,
  AlertCircle,
  Shield,
  Loader2,
  Plus,
  HeartHandshake,
} from "lucide-react";
import { useDashboard } from "@/context/DashboardContext";

export default function ProfileOverviewPage() {
  const { activeProfile, isDemo, loading } = useDashboard();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#1E3A2F]" />
      </div>
    );
  }

  if (!activeProfile && !isDemo) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center mx-auto shadow-xs">
          <HeartHandshake className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A2F]">
            No Healthcare Record Found
          </h1>
          <p className="text-sm text-[#5C6460]">
            You have not linked or created any clinical healthcare records yet.
          </p>
        </div>
        <div className="flex justify-center pt-2">
          <Link
            href="/onboard"
            className="px-6 py-3 rounded-xl bg-[#1E3A2F] text-white font-bold text-sm hover:bg-[#162E25] shadow-xs"
          >
            Create Healthcare Profile
          </Link>
        </div>
      </div>
    );
  }

  const profile = activeProfile!;

  return (
    <div className="space-y-8">
      {/* Header Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
            Clinical Healthcare Profile
          </span>
          <h1 className="mt-2 text-3xl font-extrabold text-[#1E3A2F]">
            {profile.displayName}&apos;s Health Record
          </h1>
          <p className="text-sm text-[#5C6460]">
            Central clinical profile governing medication schedules, appointments, and care permissions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/members"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-white text-sm font-semibold text-[#1E3A2F] hover:border-[#607B6E] shadow-xs"
          >
            <Users className="w-4 h-4 text-[#607B6E]" />
            Manage Members &amp; Passcodes
          </Link>
          <Link
            href="/onboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-sm font-semibold text-white shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Create New Profile
          </Link>
        </div>
      </div>

      {/* Grid: Profile Sections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Basic Information */}
        <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#1E3A2F]">Basic Details</h2>
          </div>

          <div className="space-y-2 text-sm text-[#5C6460]">
            <div>
              <span className="font-bold text-[#1F2421] block">Full Name:</span>
              <span>{profile.displayName}</span>
            </div>
            <div>
              <span className="font-bold text-[#1F2421] block">Date of Birth:</span>
              <span>{profile.dateOfBirth}</span>
            </div>
            <div>
              <span className="font-bold text-[#1F2421] block">Blood Group:</span>
              <span className="font-semibold text-red-900 bg-red-50 px-2 py-0.5 rounded">
                {profile.bloodGroup || "Not recorded"}
              </span>
            </div>
            <div>
              <span className="font-bold text-[#1F2421] block">Timezone:</span>
              <span>{profile.timezone}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Emergency Contact */}
        <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
              <PhoneCall className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#1E3A2F]">Emergency Anchor</h2>
          </div>

          <div className="space-y-2 text-sm text-[#5C6460]">
            <div>
              <span className="font-bold text-[#1F2421] block">Primary Contact:</span>
              <span className="text-base font-semibold text-[#1E3A2F]">
                {profile.emergencyContactName || "Not configured"}
              </span>
            </div>
            <div>
              <span className="font-bold text-[#1F2421] block">Contact Phone:</span>
              {profile.emergencyContactPhone ? (
                <a
                  href={`tel:${profile.emergencyContactPhone}`}
                  className="text-base font-mono font-bold text-amber-900 hover:underline block"
                >
                  {profile.emergencyContactPhone}
                </a>
              ) : (
                <span className="text-xs text-[#5C6460]">Not provided</span>
              )}
            </div>
            <p className="text-xs text-[#607B6E] pt-2 border-t border-[#EFECE6]">
              Configured for automated escalation alerts when doses remain unconfirmed.
            </p>
          </div>
        </div>

        {/* Card 3: Clinical Provider */}
        <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center font-bold">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-[#1E3A2F]">Primary Doctor</h2>
          </div>

          <div className="space-y-2 text-sm text-[#5C6460]">
            {profile.doctorName ? (
              <>
                <div>
                  <span className="font-bold text-[#1F2421] block">Doctor:</span>
                  <span className="font-semibold text-[#1E3A2F]">Dr. {profile.doctorName}</span>
                </div>
                <div>
                  <span className="font-bold text-[#1F2421] block">Hospital:</span>
                  <span>{profile.hospitalName || "Private Clinic"}</span>
                </div>
                {profile.doctorPhone && (
                  <div>
                    <span className="font-bold text-[#1F2421] block">Clinic Phone:</span>
                    <span className="font-mono">{profile.doctorPhone}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="text-xs text-[#5C6460] italic py-4">
                No primary doctor details recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Conditions & Allergies Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Conditions */}
        <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-4">
          <h2 className="text-xl font-bold text-[#1E3A2F] flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-700" />
            Existing Medical Conditions
          </h2>
          {profile.medicalConditions && profile.medicalConditions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.medicalConditions.map((condition) => (
                <span
                  key={condition}
                  className="px-3 py-1.5 rounded-full bg-[#EBF2EE] text-[#1E3A2F] font-semibold text-xs border border-[#D5E2D9]"
                >
                  {condition}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5C6460] italic">No existing conditions recorded.</p>
          )}
        </div>

        {/* Allergies */}
        <div className="p-8 rounded-3xl bg-white border border-[#EFECE6] space-y-4">
          <h2 className="text-xl font-bold text-red-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-700" />
            Known Allergies
          </h2>
          {profile.allergies && profile.allergies.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.allergies.map((allergy) => (
                <span
                  key={allergy}
                  className="px-3 py-1.5 rounded-full bg-red-50 text-red-900 font-bold text-xs border border-red-200"
                >
                  ⚠️ {allergy}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-[#5C6460] italic">No known drug allergies recorded.</p>
          )}
        </div>
      </div>

      {/* Security Banner */}
      <div className="p-6 rounded-3xl bg-[#EBF2EE] border border-[#D5E2D9] flex items-start gap-4">
        <Shield className="w-6 h-6 text-[#1E3A2F] shrink-0 mt-0.5" />
        <div className="text-xs text-[#1E3A2F] leading-relaxed">
          <span className="font-bold text-sm block mb-1">Row Level Security (RLS) Protected</span>
          Access to this healthcare profile is strictly restricted to active members verified through <code className="bg-white px-1 py-0.5 rounded border border-[#D5E2D9]">profile_access_members</code>. Cross-profile access is denied at the database engine level.
        </div>
      </div>
    </div>
  );
}
