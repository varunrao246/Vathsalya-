"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  HeartHandshake,
  User,
  Users,
  AlertCircle,
  PhoneCall,
  Stethoscope,
  ArrowRight,
  ArrowLeft,
  Check,
  Shield,
  Loader2,
  Plus,
} from "lucide-react";

const COMMON_CONDITIONS = [
  "Hypertension (Blood Pressure)",
  "Type 2 Diabetes",
  "Arthritis",
  "Asthma",
  "Thyroid Disorder",
  "Heart Condition",
  "Cholesterol (Dyslipidemia)",
];

const COMMON_ALLERGIES = [
  "Penicillin",
  "Sulfa Drugs",
  "Aspirin / NSAIDs",
  "Ibuprofen",
  "Latex",
  "Peanuts",
  "Dairy",
];

export default function HealthcareProfileOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [isSelf, setIsSelf] = useState<boolean>(true);

  // Step 1: Basic Information
  const [displayName, setDisplayName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE" | "OTHER" | "">("");
  const [bloodGroup, setBloodGroup] = useState("");
  const timezone = "Asia/Kolkata";

  // Step 2: Healthcare Details
  const [medicalConditions, setMedicalConditions] = useState<string[]>([]);
  const [customCondition, setCustomCondition] = useState("");
  const [allergies, setAllergies] = useState<string[]>([]);
  const [customAllergy, setCustomAllergy] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [hospitalName, setHospitalName] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");

  // Step 3: Emergency Anchor
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("Daughter");

  // Submission State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const toggleCondition = (cond: string) => {
    setMedicalConditions((prev) =>
      prev.includes(cond) ? prev.filter((c) => c !== cond) : [...prev, cond]
    );
  };

  const addCustomCondition = () => {
    if (customCondition.trim() && !medicalConditions.includes(customCondition.trim())) {
      setMedicalConditions([...medicalConditions, customCondition.trim()]);
      setCustomCondition("");
    }
  };

  const toggleAllergy = (allg: string) => {
    setAllergies((prev) =>
      prev.includes(allg) ? prev.filter((a) => a !== allg) : [...prev, allg]
    );
  };

  const addCustomAllergy = () => {
    if (customAllergy.trim() && !allergies.includes(customAllergy.trim())) {
      setAllergies([...allergies, customAllergy.trim()]);
      setCustomAllergy("");
    }
  };

  const handleNextStep1 = () => {
    if (!displayName.trim() || !dateOfBirth) {
      setErrorMessage("Please enter the full name and date of birth.");
      return;
    }
    setErrorMessage(null);
    setStep(2);
  };

  const handleNextStep2 = () => {
    setErrorMessage(null);
    setStep(3);
  };

  const handleNextStep3 = () => {
    if (!emergencyName.trim() || !emergencyPhone.trim()) {
      setErrorMessage("Emergency contact name and phone number are required.");
      return;
    }
    setErrorMessage(null);
    setStep(4);
  };

  const handleSubmitProfile = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const payload = {
        displayName: displayName.trim(),
        dateOfBirth,
        gender: gender || null,
        bloodGroup: bloodGroup || null,
        timezone,
        emergencyContactName: `${emergencyName.trim()} (${emergencyRelation})`,
        emergencyContactPhone: emergencyPhone.trim(),
        medicalConditions,
        allergies,
        doctorName: doctorName.trim() || null,
        hospitalName: hospitalName.trim() || null,
        doctorPhone: doctorPhone.trim() || null,
        isSelf,
      };

      const res = await fetch("/api/healthcare-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        if (res.status === 401) {
          throw new Error("You must be logged in to create a healthcare profile. Please sign in or register first.");
        }
        throw new Error(json.error?.message || "Failed to save healthcare profile.");
      }

      // Redirect to appropriate dashboard based on journey
      router.push(isSelf ? "/dashboard/elderly" : "/dashboard/family");
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 group mb-4">
            <div className="w-12 h-12 rounded-2xl bg-[#1E3A2F] text-white flex items-center justify-center shadow-xs">
              <HeartHandshake className="w-7 h-7 text-[#EBF2EE]" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#1E3A2F]">VATSALYA</span>
            <span className="text-lg font-medium text-[#607B6E]">वात्सल्य</span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1E3A2F]">
            Healthcare Profile Onboarding
          </h1>
          <p className="mt-1 text-base text-[#5C6460]">
            Create a dignified, secure health record to anchor medications, appointments, and care collaboration.
          </p>
        </div>

        {/* Step Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs font-bold text-[#607B6E] uppercase tracking-wider mb-2">
            <span>Step {step} of 4</span>
            <span>
              {step === 1 && "1. Basic Details"}
              {step === 2 && "2. Health Details"}
              {step === 3 && "3. Emergency Contact"}
              {step === 4 && "4. Review & Confirm"}
            </span>
          </div>
          <div className="w-full bg-[#EFECE6] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#1E3A2F] h-full transition-all duration-300"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>

        {/* Onboarding Card */}
        <div className="bg-white rounded-3xl border border-[#EFECE6] shadow-xs p-6 sm:p-10 space-y-6">
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-sm text-red-900 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 1: Basic Information & Journey Selection */}
          {/* ============================================================ */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#1F2421] mb-2">
                  Select Onboarding Journey
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setIsSelf(true)}
                    className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                      isSelf ? "border-[#1E3A2F] bg-[#EBF2EE]/50" : "border-[#EFECE6] bg-[#FDFBF7]"
                    }`}
                  >
                    <User className={`w-6 h-6 mt-0.5 ${isSelf ? "text-[#1E3A2F]" : "text-[#607B6E]"}`} />
                    <div>
                      <span className="text-base font-bold text-[#1E3A2F] block">
                        Journey 1: For Myself
                      </span>
                      <span className="text-xs text-[#5C6460]">
                        I am an older adult setting up my own healthcare profile.
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsSelf(false)}
                    className={`p-4 rounded-2xl border-2 text-left flex items-start gap-3 transition-all ${
                      !isSelf ? "border-[#1E3A2F] bg-[#EBF2EE]/50" : "border-[#EFECE6] bg-[#FDFBF7]"
                    }`}
                  >
                    <Users className={`w-6 h-6 mt-0.5 ${!isSelf ? "text-[#1E3A2F]" : "text-[#607B6E]"}`} />
                    <div>
                      <span className="text-base font-bold text-[#1E3A2F] block">
                        Journey 2: For My Parent
                      </span>
                      <span className="text-xs text-[#5C6460]">
                        I am a family member setting up care on behalf of my elderly parent.
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-bold text-[#1F2421]">
                  {isSelf ? "Your Full Name / What should we call you?" : "Elderly Person's Full Name (e.g. Appaji Rao)"}
                  <span className="text-red-600 ml-1">*</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Appaji Rao / Savitri Amma"
                  className="mt-1 w-full px-4 py-3.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-base focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="dateOfBirth" className="block text-sm font-bold text-[#1F2421]">
                    Date of Birth <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="dateOfBirth"
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="mt-1 w-full px-4 py-3.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-base focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="gender" className="block text-sm font-bold text-[#1F2421]">
                    Gender (Optional)
                  </label>
                  <select
                    id="gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as "MALE" | "FEMALE" | "OTHER" | "")}
                    className="mt-1 w-full px-4 py-3.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-base focus:bg-white"
                  >
                    <option value="">Prefer not to state</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="bloodGroup" className="block text-sm font-bold text-[#1F2421]">
                    Blood Group (Optional)
                  </label>
                  <select
                    id="bloodGroup"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="mt-1 w-full px-4 py-3.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-[#1F2421] text-base focus:bg-white"
                  >
                    <option value="">Select blood group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="timezone" className="block text-sm font-bold text-[#1F2421]">
                    Time Zone
                  </label>
                  <input
                    id="timezone"
                    type="text"
                    disabled
                    value={timezone}
                    className="mt-1 w-full px-4 py-3.5 rounded-xl border border-[#EFECE6] bg-[#EFECE6]/50 text-[#5C6460] text-base cursor-not-allowed"
                  />
                  <span className="text-xs text-[#5C6460] mt-0.5 block">Indian Standard Time (Asia/Kolkata)</span>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep1}
                  className="senior-touch-target px-8 py-3.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  Continue to Health Details
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: Healthcare Information */}
          {/* ============================================================ */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-[#1F2421] mb-1">
                  Existing Medical Conditions
                </label>
                <p className="text-xs text-[#5C6460] mb-3">
                  Select common chronic conditions or add custom ones:
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_CONDITIONS.map((cond) => {
                    const isSelected = medicalConditions.includes(cond);
                    return (
                      <button
                        key={cond}
                        type="button"
                        onClick={() => toggleCondition(cond)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-[#1E3A2F] text-white border-[#1E3A2F]"
                            : "bg-[#FDFBF7] text-[#1F2421] border-[#EFECE6] hover:border-[#607B6E]"
                        }`}
                      >
                        {cond} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCondition}
                    onChange={(e) => setCustomCondition(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomCondition())}
                    placeholder="Add custom medical condition..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm text-[#1F2421]"
                  />
                  <button
                    type="button"
                    onClick={addCustomCondition}
                    className="px-4 py-2.5 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] text-sm font-bold hover:bg-[#D5E2D9] flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-[#1F2421] mb-1">
                  Known Drug &amp; Environmental Allergies
                </label>
                <p className="text-xs text-[#5C6460] mb-3">
                  Crucial for safety to prevent adverse drug reactions:
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {COMMON_ALLERGIES.map((allg) => {
                    const isSelected = allergies.includes(allg);
                    return (
                      <button
                        key={allg}
                        type="button"
                        onClick={() => toggleAllergy(allg)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                          isSelected
                            ? "bg-red-800 text-white border-red-800"
                            : "bg-[#FDFBF7] text-[#1F2421] border-[#EFECE6] hover:border-red-400"
                        }`}
                      >
                        {allg} {isSelected && "✓"}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAllergy}
                    onChange={(e) => setCustomAllergy(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAllergy())}
                    placeholder="Add custom allergy (e.g. Sulfa drugs)..."
                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm text-[#1F2421]"
                  />
                  <button
                    type="button"
                    onClick={addCustomAllergy}
                    className="px-4 py-2.5 rounded-xl bg-[#EBF2EE] text-[#1E3A2F] text-sm font-bold hover:bg-[#D5E2D9] flex items-center gap-1"
                  >
                    <Plus className="w-4 h-4" /> Add
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFECE6] space-y-4">
                <h2 className="text-base font-bold text-[#1E3A2F] flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-[#607B6E]" />
                  Primary Doctor &amp; Hospital Details (Optional)
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="doctorName" className="block text-xs font-bold text-[#5C6460]">
                      Doctor Name
                    </label>
                    <input
                      id="doctorName"
                      type="text"
                      value={doctorName}
                      onChange={(e) => setDoctorName(e.target.value)}
                      placeholder="Dr. Ramesh"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="hospitalName" className="block text-xs font-bold text-[#5C6460]">
                      Hospital / Clinic
                    </label>
                    <input
                      id="hospitalName"
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      placeholder="Manipal Hospital"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                    />
                  </div>
                  <div>
                    <label htmlFor="doctorPhone" className="block text-xs font-bold text-[#5C6460]">
                      Doctor / Clinic Phone
                    </label>
                    <input
                      id="doctorPhone"
                      type="tel"
                      value={doctorPhone}
                      onChange={(e) => setDoctorPhone(e.target.value)}
                      placeholder="+91 80 2502 4444"
                      className="mt-1 w-full px-3 py-2.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-sm"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl border border-[#EFECE6] text-[#1E3A2F] font-semibold text-sm hover:bg-[#FDFBF7] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep2}
                  className="senior-touch-target px-8 py-3.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  Continue to Emergency Contact
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 3: Emergency Contact Anchor */}
          {/* ============================================================ */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-[#1E3A2F] flex items-center gap-2 mb-1">
                  <PhoneCall className="w-5 h-5 text-[#B45309]" />
                  Primary Emergency Contact Anchor
                </h2>
                <p className="text-xs text-[#5C6460]">
                  This contact receives immediate escalation calls and alert notifications if medications are missed or if the elder taps &quot;Need Help&quot;.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="emergencyName" className="block text-sm font-bold text-[#1F2421]">
                    Contact Full Name <span className="text-red-600">*</span>
                  </label>
                  <input
                    id="emergencyName"
                    type="text"
                    required
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Priya Sharma"
                    className="mt-1 w-full px-4 py-3.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-base"
                  />
                </div>

                <div>
                  <label htmlFor="emergencyRelation" className="block text-sm font-bold text-[#1F2421]">
                    Relationship to Elder
                  </label>
                  <select
                    id="emergencyRelation"
                    value={emergencyRelation}
                    onChange={(e) => setEmergencyRelation(e.target.value)}
                    className="mt-1 w-full px-4 py-3.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-base"
                  >
                    <option value="Daughter">Daughter</option>
                    <option value="Son">Son</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Family Member">Family Member</option>
                    <option value="Primary Caregiver">Primary Caregiver</option>
                    <option value="Neighbor / Friend">Neighbor / Friend</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="emergencyPhone" className="block text-sm font-bold text-[#1F2421]">
                  Emergency Phone Number <span className="text-red-600">*</span>
                </label>
                <input
                  id="emergencyPhone"
                  type="tel"
                  required
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="mt-1 w-full px-4 py-3.5 rounded-xl border border-[#EFECE6] bg-[#FDFBF7] text-base"
                />
                <span className="text-xs text-[#5C6460] mt-1 block">
                  Must be reachable 24/7 for escalation alerts.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl border border-[#EFECE6] text-[#1E3A2F] font-semibold text-sm hover:bg-[#FDFBF7] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button
                  type="button"
                  onClick={handleNextStep3}
                  className="senior-touch-target px-8 py-3.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
                >
                  Review Summary
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 4: Review and Explicit Confirmation */}
          {/* ============================================================ */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="p-4 rounded-2xl bg-[#EBF2EE] border border-[#D5E2D9]">
                <h2 className="text-base font-bold text-[#1E3A2F] flex items-center gap-2">
                  <Check className="w-5 h-5 text-emerald-700" />
                  Review Healthcare Profile Details
                </h2>
                <p className="text-xs text-[#5C6460] mt-0.5">
                  Confirm the details below. You can edit any section before finalizing.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] space-y-1">
                  <span className="text-xs font-bold text-[#607B6E] uppercase">Patient Details</span>
                  <p className="font-bold text-lg text-[#1E3A2F]">{displayName}</p>
                  <p className="text-[#5C6460]">DOB: {dateOfBirth} {gender ? `• ${gender}` : ""}</p>
                  <p className="text-[#5C6460]">Blood Group: {bloodGroup || "Not specified"}</p>
                  <p className="text-xs text-[#607B6E] font-medium">
                    Journey: {isSelf ? "Self-Onboarded (Elderly Owner)" : "Family-Onboarded (Family Admin)"}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] space-y-1">
                  <span className="text-xs font-bold text-[#607B6E] uppercase">Emergency Anchor</span>
                  <p className="font-bold text-lg text-[#1E3A2F]">{emergencyName} ({emergencyRelation})</p>
                  <p className="text-[#5C6460] font-mono">{emergencyPhone}</p>
                  <span className="text-xs text-amber-800 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                    Primary 24/7 Contact
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#FDFBF7] border border-[#EFECE6] space-y-2 text-sm">
                <span className="text-xs font-bold text-[#607B6E] uppercase">Clinical Background</span>
                <div>
                  <strong className="text-xs text-[#1F2421]">Medical Conditions: </strong>
                  {medicalConditions.length > 0 ? (
                    <span className="text-[#5C6460]">{medicalConditions.join(", ")}</span>
                  ) : (
                    <span className="text-[#5C6460] italic">None listed</span>
                  )}
                </div>
                <div>
                  <strong className="text-xs text-red-800">Allergies: </strong>
                  {allergies.length > 0 ? (
                    <span className="text-red-900 font-semibold">{allergies.join(", ")}</span>
                  ) : (
                    <span className="text-[#5C6460] italic">None reported</span>
                  )}
                </div>
                {doctorName && (
                  <div>
                    <strong className="text-xs text-[#1F2421]">Primary Doctor: </strong>
                    <span className="text-[#5C6460]">
                      {doctorName} {hospitalName ? `(${hospitalName})` : ""} {doctorPhone ? `• ${doctorPhone}` : ""}
                    </span>
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-[#FEF3C7] border border-amber-300 text-xs text-amber-950 flex items-start gap-2">
                <Shield className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <span>
                  <strong>Dignified Healthcare Mandate:</strong> The elderly individual remains central to all healthcare decisions. Family and caretakers act strictly as collaborative support.
                </span>
              </div>

              <div className="pt-4 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  disabled={loading}
                  className="px-6 py-3 rounded-xl border border-[#EFECE6] text-[#1E3A2F] font-semibold text-sm hover:bg-[#FDFBF7] flex items-center gap-1.5"
                >
                  <ArrowLeft className="w-4 h-4" /> Edit Information
                </button>
                <button
                  type="button"
                  onClick={handleSubmitProfile}
                  disabled={loading}
                  className="senior-touch-target px-8 py-3.5 rounded-xl bg-[#1E3A2F] hover:bg-[#162E25] text-white font-bold flex items-center gap-2 cursor-pointer transition-colors shadow-xs disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Healthcare Profile...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Confirm &amp; Create Profile
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
