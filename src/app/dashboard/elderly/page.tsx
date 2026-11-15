"use client";

import { useState } from "react";
import {
  Check,
  PhoneCall,
  Mic,
  Calendar,
  Volume2,
  Pill,
} from "lucide-react";

export default function ElderlyDashboard() {
  const [doseTaken, setDoseTaken] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);

  const handleMarkTaken = () => {
    setDoseTaken(true);
    // Haptic vibration feedback on supported devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Role Banner / Context */}
      <div className="flex items-center justify-between pb-4 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-bold tracking-wider px-3 py-1 rounded-full bg-[#EBF2EE] text-[#1E3A2F]">
            Elderly Independent Mode (ಹಿರಿಯರ ಮೋಡ್)
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-extrabold text-[#1E3A2F]">
            ನಮಸ್ಕಾರ ಅಪ್ಪಾಜಿ (Good Morning Appaji)
          </h1>
          <p className="mt-1 text-lg text-[#5C6460]">
            Today is Sunday, 15 November • Bangalore
          </p>
        </div>

        {/* Voice Trigger Bubble */}
        <button
          onClick={() => setVoiceActive(!voiceActive)}
          className={`senior-touch-target p-4 rounded-2xl flex items-center justify-center transition-all shadow-sm ${
            voiceActive
              ? "bg-[#B45309] text-white animate-pulse"
              : "bg-[#1E3A2F] text-white hover:bg-[#162E25]"
          }`}
          aria-label="Voice Assistant in Kannada and English"
        >
          <Mic className="w-8 h-8" />
        </button>
      </div>

      {/* Voice Assistant Mock Drawer */}
      {voiceActive && (
        <div className="p-6 rounded-3xl bg-[#EBF2EE] border-2 border-[#1E3A2F] space-y-3">
          <div className="flex items-center gap-2 text-[#1E3A2F] font-bold text-lg">
            <Volume2 className="w-6 h-6" />
            <span>Voice Assistant Active (ಧ್ವನಿ ಸಹಾಯಕ)</span>
          </div>
          <p className="text-base text-[#1E3A2F]">
            ಕನ್ನಡದಲ್ಲಿ ಅಥವಾ English ನಲ್ಲಿ ಕೇಳಿ: &quot;ಇವತ್ತಿನ ಮಾತ್ರೆ ಯಾವುದು?&quot; (Which is my medicine today?)
          </p>
          <p className="text-xs text-[#5C6460]">
            * Note: To prevent accidental confirms, voice commands explain your schedule; marking a dose taken requires tapping the green button below.
          </p>
        </div>
      )}

      {/* Main Focus: The Due Dose Card */}
      <div className="p-8 rounded-3xl bg-white border-2 border-[#1E3A2F] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold uppercase tracking-wider px-3.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
            Due Now (ಈಗ ತೆಗೆದುಕೊಳ್ಳಿ)
          </span>
          <span className="text-xl font-bold text-[#1E3A2F]">08:30 AM</span>
        </div>

        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-[#EBF2EE] flex items-center justify-center text-[#1E3A2F] shrink-0">
            <Pill className="w-9 h-9" />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-[#1E3A2F]">
              Telmisartan (40 mg)
            </h2>
            <p className="mt-1 text-xl font-medium text-[#5C6460]">
              Take 1 tablet after breakfast with water
            </p>
            <p className="text-base text-[#607B6E] mt-0.5 font-medium">
              ಬೆಳಗಿನ ಉಪಹಾರದ ನಂತರ 1 ಮಾತ್ರೆ
            </p>
          </div>
        </div>

        {/* Large Confirmation Button (min 64px height) */}
        {!doseTaken ? (
          <button
            onClick={handleMarkTaken}
            className="w-full senior-touch-target py-5 px-6 rounded-2xl bg-[#1E3A2F] hover:bg-[#162E25] text-white text-2xl font-bold transition-all shadow-sm flex items-center justify-center gap-3 cursor-pointer"
          >
            <Check className="w-8 h-8 stroke-[3]" />
            Mark as Taken (ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ)
          </button>
        ) : (
          <div className="w-full py-5 px-6 rounded-2xl bg-emerald-50 border-2 border-emerald-600 text-emerald-900 text-xl font-bold flex items-center justify-center gap-3">
            <Check className="w-8 h-8 text-emerald-700 stroke-[3]" />
            Confirmed Taken at 08:35 AM! (ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ)
          </div>
        )}
      </div>

      {/* Secondary Information Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {/* Upcoming Doctor Visit */}
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-3">
          <div className="flex items-center gap-2 text-[#1E3A2F]">
            <Calendar className="w-6 h-6 text-[#607B6E]" />
            <h3 className="text-lg font-bold">Next Doctor Visit</h3>
          </div>
          <div>
            <p className="text-xl font-bold text-[#1E3A2F]">Dr. Ramesh (Cardiology)</p>
            <p className="text-base text-[#5C6460]">Wednesday, Nov 18 • 10:30 AM</p>
            <p className="text-sm text-[#607B6E] font-medium mt-1">
              Daughter Priya is accompanying you
            </p>
          </div>
        </div>

        {/* Emergency Assistance */}
        <div className="p-6 rounded-3xl bg-[#FEF3C7] border border-amber-300 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-950">
              <PhoneCall className="w-6 h-6 text-amber-800" />
              <h3 className="text-lg font-bold">Need Help? (ಸಹಾಯ ಬೇಕೇ?)</h3>
            </div>
            <p className="mt-1 text-sm text-amber-900">
              Tap to call your primary contact Priya directly.
            </p>
          </div>
          <a
            href="tel:+919876543210"
            className="w-full senior-touch-target py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-center flex items-center justify-center gap-2"
          >
            <PhoneCall className="w-5 h-5" />
            Call Priya (+91 98765 43210)
          </a>
        </div>
      </div>
    </div>
  );
}
