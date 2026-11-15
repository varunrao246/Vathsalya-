"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Volume2,
  PhoneCall,
  Calendar,
  Mic,
  MicOff,
  HeartHandshake,
  Loader2,
  Languages,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import type { DoseOccurrence } from "@/lib/medications/dose-engine";
import { useDashboard } from "@/context/DashboardContext";

interface ChatMessage {
  id: string;
  sender: "assistant" | "user";
  text: string;
  time: string;
}

interface SpeechRecognitionEventLike {
  results: { [index: number]: { [index: number]: { transcript: string } } };
}

interface SpeechRecognitionErrorLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface WindowWithSpeech {
  SpeechRecognition?: new () => SpeechRecognitionInstance;
  webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
}

export default function ElderlyDashboard() {
  const { user, activeProfile, isDemo, loading: dashboardLoading } = useDashboard();

  const [timeline, setTimeline] = useState<DoseOccurrence[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Voice Assistant State
  const [voiceActive, setVoiceActive] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<"kn" | "en">("kn");
  const [isListening, setIsListening] = useState(false);
  const [processingVoice, setProcessingVoice] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [highlightConfirmButton, setHighlightConfirmButton] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement | null>(null);

  const fetchTimeline = useCallback(async (profileId: string) => {
    try {
      const res = await fetch(`/api/doses/today?healthcareProfileId=${profileId}`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data?.timeline)) {
        setTimeline(json.data.timeline);
      } else {
        setTimeline([]);
      }
    } catch {
      setTimeline([]);
    }
  }, []);

  useEffect(() => {
    if (activeProfile) {
      fetchTimeline(activeProfile.id);
    } else {
      setTimeline([]);
    }
  }, [activeProfile, fetchTimeline]);

  // Locate the most pressing dose (DUE, OVERDUE, or next UPCOMING)
  const activeDose =
    timeline.find((d) => d.status === "DUE" || d.status === "OVERDUE") ||
    timeline.find((d) => d.status === "UPCOMING") ||
    timeline[0] ||
    null;

  // Web Speech Synthesis (TTS) Helper
  const speakText = useCallback(
    (text: string, lang: "kn" | "en") => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === "kn" ? "kn-IN" : "en-IN";
        utterance.rate = 0.92; // Slightly measured rate for elderly clarity

        const voices = window.speechSynthesis.getVoices();
        const matched = voices.find((v) =>
          v.lang.toLowerCase().startsWith(lang === "kn" ? "kn" : "en")
        );
        if (matched) {
          utterance.voice = matched;
        }

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    },
    []
  );

  // Initialize and speak initial prompt when voice assistant is activated
  const toggleVoiceAssistant = () => {
    const nextState = !voiceActive;
    setVoiceActive(nextState);

    if (nextState) {
      const greeting =
        voiceLanguage === "kn"
          ? "ನಮಸ್ಕಾರ! ನಿಮ್ಮ ನಿಗದಿತ ಮಾತ್ರೆ ತೆಗೆದುಕೊಳ್ಳುವ ಸಮಯವಾಗಿದೆ. ನೀವು ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ?"
          : "Namaste! It is time for your scheduled medication. Have you taken your tablet?";

      setChatHistory([
        {
          id: `msg-${Date.now()}`,
          sender: "assistant",
          text: greeting,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);

      speakText(greeting, voiceLanguage);
    } else {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      setIsListening(false);
    }
  };

  // Process user utterance through API
  const handleProcessTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;

    // Add user message to transcript history
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: transcript,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setProcessingVoice(true);

    try {
      const res = await fetch("/api/voice/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transcript,
          language: voiceLanguage,
          healthcareProfileId: activeProfile?.id,
          occurrenceKey: activeDose?.occurrenceKey,
          medicationName: activeDose?.medicationName,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        const replyText = json.data.spokenText;
        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: "assistant",
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setChatHistory((prev) => [...prev, assistantMsg]);

        // Play Gnani.ai Timbre synthesized audio or fallback to Web Speech
        if (json.data.audioBase64) {
          try {
            const audio = new Audio(json.data.audioBase64);
            audio.play().catch(() => speakText(replyText, voiceLanguage));
          } catch {
            speakText(replyText, voiceLanguage);
          }
        } else {
          speakText(replyText, voiceLanguage);
        }

        // Clinical Safety Rule: Voice alone NEVER marks dose as taken
        if (json.data.requiresVisualTap) {
          setHighlightConfirmButton(true);
          // Gently scroll confirmation button into view
          if (confirmButtonRef.current) {
            confirmButtonRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      }
    } catch (err) {
      console.error("Voice processing error:", err);
    } finally {
      setProcessingVoice(false);
    }
  };

  // Start Web Speech Recognition
  const startListening = () => {
    if (typeof window === "undefined") return;

    const win = window as unknown as WindowWithSpeech;
    const SpeechRecognition = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Speech recognition is not supported in this browser. Please use the quick-action buttons below.");
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const recognition = new SpeechRecognition();
      recognition.lang = voiceLanguage === "kn" ? "kn-IN" : "en-IN";
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        const transcript = event.results[0]?.[0]?.transcript || "";
        setIsListening(false);
        if (transcript) {
          handleProcessTranscript(transcript);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorLike) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.warn("Failed to start speech recognition:", e);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const handleMarkTaken = async (dose: DoseOccurrence) => {
    if (!activeProfile) return;
    setSubmitting(true);
    setStatusMessage(null);
    setHighlightConfirmButton(false);

    // Haptic vibration feedback on supported devices
    if (typeof window !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    try {
      const res = await fetch("/api/doses/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          healthcareProfileId: activeProfile.id,
          scheduleId: dose.scheduleId,
          scheduledAt: dose.scheduledAt,
          scheduledDate: dose.scheduledDate,
          scheduledTime: dose.scheduledTime,
          action: "TAKEN",
          notes: `Confirmed directly on elderly dashboard for ${activeProfile.displayName}`,
        }),
      });

      const json = await res.json();
      if (json.success) {
        const successMsg =
          voiceLanguage === "kn"
            ? "ಧನ್ಯವಾದಗಳು! ನಿಮ್ಮ ಡೋಸ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ."
            : "Thank you! Your dose has been recorded.";
        setStatusMessage(successMsg);
        speakText(successMsg, voiceLanguage);
        fetchTimeline(activeProfile.id);
      } else {
        setStatusMessage(json.error?.message || "Could not save confirmation.");
      }
    } catch {
      setStatusMessage("Failed to connect. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (dashboardLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <Loader2 className="w-8 h-8 text-[#1E3A2F] animate-spin" />
        <p className="text-sm font-bold text-[#5C6460]">Loading elderly care view...</p>
      </div>
    );
  }

  // Empty state if authenticated without profile
  if (!activeProfile && !isDemo) {
    return (
      <div className="max-w-xl mx-auto py-12 px-4 text-center space-y-6">
        <div className="w-16 h-16 rounded-3xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center mx-auto shadow-xs">
          <HeartHandshake className="w-9 h-9" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-[#1E3A2F]">
            ನಮಸ್ಕಾರ (Welcome, {user?.fullName || "User"})
          </h1>
          <p className="text-sm text-[#5C6460]">
            You do not have an active elderly healthcare profile linked yet. Set up your profile or join with a family invitation code to view your daily schedule.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/onboard"
            className="px-5 py-3 rounded-xl bg-[#1E3A2F] text-white font-bold text-sm hover:bg-[#162E25]"
          >
            Create My Healthcare Profile
          </Link>
          <Link
            href="/join"
            className="px-5 py-3 rounded-xl bg-white border border-[#EFECE6] text-[#1E3A2F] font-bold text-sm hover:bg-[#FAF8F5]"
          >
            Join Family Profile
          </Link>
        </div>
      </div>
    );
  }

  const patientDisplayName = activeProfile?.displayName || "ಅಪ್ಪಾಜಿ";
  const emergencyName = activeProfile?.emergencyContactName || "Family Caregiver";
  const emergencyPhone = activeProfile?.emergencyContactPhone || "";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Role Banner / Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EFECE6]">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider px-3.5 py-1.5 rounded-full bg-[#EBF2EE] text-[#1E3A2F] border border-[#D5E2D9] inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            Elderly Independent Mode (ಹಿರಿಯರ ಮೋಡ್)
          </span>
          <h1 className="mt-3 text-3xl sm:text-4xl font-black text-[#1E3A2F] tracking-tight">
            ನಮಸ್ಕಾರ {patientDisplayName}
          </h1>
          <p className="mt-1 text-base sm:text-lg text-[#5C6460]">
            Care Schedule • {activeProfile?.timezone || "Asia/Kolkata"}
          </p>
        </div>

        {/* Voice Trigger Pulse Button (Audio Context Unlocker) */}
        <button
          onClick={toggleVoiceAssistant}
          className={`senior-touch-target px-5 py-3.5 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-sm cursor-pointer ${
            voiceActive
              ? "bg-[#B45309] text-white ring-4 ring-amber-300"
              : "bg-[#1E3A2F] text-white hover:bg-[#162E25] ring-2 ring-emerald-600/30"
          }`}
          aria-label="Voice Assistant in Kannada and English"
        >
          <Volume2 className="w-6 h-6 animate-pulse" />
          <span className="font-extrabold text-sm sm:text-base">
            {voiceActive ? "ಧ್ವನಿ ಸಕ್ರಿಯವಾಗಿದೆ (Active)" : "🔊 ಧ್ವನಿ ಜ್ಞಾಪನೆ (Start Voice)"}
          </span>
        </button>
      </div>

      {/* Voice Assistant Interactive Panel */}
      {voiceActive && (
        <div className="p-6 rounded-3xl bg-[#F4F8F5] border-2 border-[#1E3A2F] space-y-5 animate-in fade-in duration-200 shadow-md">
          {/* Header Controls: Language Selection & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D5E2D9]">
            <div className="flex items-center gap-2 text-[#1E3A2F] font-black text-lg">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span>ಧ್ವನಿ ಸಹಾಯಕ (Voice Medication Assistant)</span>
            </div>

            {/* Language Toggle: Kannada vs English */}
            <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-[#D5E2D9]">
              <Languages className="w-4 h-4 ml-2 text-[#5C6460]" />
              <button
                type="button"
                onClick={() => {
                  setVoiceLanguage("kn");
                  speakText("ಕನ್ನಡ ಆಯ್ಕೆ ಮಾಡಲಾಗಿದೆ. ನೀವು ಮಾತ್ರೆ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಾ?", "kn");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  voiceLanguage === "kn"
                    ? "bg-[#1E3A2F] text-white shadow-xs"
                    : "text-[#5C6460] hover:text-[#1E3A2F]"
                }`}
              >
                ಕನ್ನಡ (Kannada)
              </button>
              <button
                type="button"
                onClick={() => {
                  setVoiceLanguage("en");
                  speakText("English selected. Have you taken your tablet?", "en");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                  voiceLanguage === "en"
                    ? "bg-[#1E3A2F] text-white shadow-xs"
                    : "text-[#5C6460] hover:text-[#1E3A2F]"
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Transcript / Conversation History View */}
          <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
            {chatHistory.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-4 rounded-2xl text-sm sm:text-base leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-[#1E3A2F] text-white rounded-br-xs"
                      : "bg-white text-[#1E3A2F] border border-[#D5E2D9] rounded-bl-xs shadow-xs"
                  }`}
                >
                  <p className="font-semibold">{msg.text}</p>
                  <span
                    className={`block mt-1 text-[11px] ${
                      msg.sender === "user" ? "text-emerald-200" : "text-[#5C6460]"
                    }`}
                  >
                    {msg.sender === "user" ? "ನೀವು (You)" : "ವಾತ್ಸಲ್ಯ (Vatsalya)"} • {msg.time}
                  </span>
                </div>
              </div>
            ))}
            {processingVoice && (
              <div className="flex items-center gap-2 text-xs text-[#5C6460] font-bold pl-2">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                <span>ಉತ್ತರವನ್ನು ಸಂಸ್ಕರಿಸಲಾಗುತ್ತಿದೆ... (Processing response...)</span>
              </div>
            )}
          </div>

          {/* Speech Control: Microphone Button */}
          <div className="flex flex-col items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-5 rounded-full flex items-center justify-center transition-all shadow-md cursor-pointer ${
                isListening
                  ? "bg-rose-600 text-white ring-8 ring-rose-200 animate-pulse scale-105"
                  : "bg-[#1E3A2F] text-white hover:bg-[#162E25] ring-4 ring-emerald-200"
              }`}
              aria-label={isListening ? "Stop listening" : "Start speaking"}
            >
              {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
            </button>
            <p className="text-xs sm:text-sm font-extrabold text-[#1E3A2F] text-center">
              {isListening
                ? "🎙️ ಆಲಿಸಲಾಗುತ್ತಿದೆ... ಈಗ ಮಾತನಾಡಿ (Listening... Speak now)"
                : "ಧ್ವನಿಯಲ್ಲಿ ಮಾತನಾಡಲು ಮೈಕ್ ಒತ್ತಿರಿ (Tap mic to speak)"}
            </p>
          </div>

          {/* Senior Quick Action Chips */}
          <div className="space-y-2 pt-2 border-t border-[#D5E2D9]">
            <p className="text-xs font-black uppercase text-[#5C6460] tracking-wider text-center">
              ಅಥವಾ ತ್ವರಿತ ಆಯ್ಕೆಯನ್ನು ಒತ್ತಿರಿ (Or tap a quick spoken answer)
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() =>
                  handleProcessTranscript(voiceLanguage === "kn" ? "ಹೌದು, ತೆಗೆದುಕೊಂಡೆ" : "Yes, I took it")
                }
                className="py-2.5 px-3 rounded-xl bg-white border-2 border-emerald-600/40 text-emerald-900 font-black text-xs hover:bg-emerald-50 active:scale-95 transition-all text-center"
              >
                ✓ ಹೌದು (Yes)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleProcessTranscript(
                    voiceLanguage === "kn" ? "ಇಲ್ಲ, ಇನ್ನು ತೆಗೆದುಕೊಂಡಿಲ್ಲ" : "No, haven't taken it yet"
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-white border-2 border-slate-300 text-slate-800 font-black text-xs hover:bg-slate-100 active:scale-95 transition-all text-center"
              >
                ✕ ಇಲ್ಲ (No)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleProcessTranscript(
                    voiceLanguage === "kn" ? "15 ನಿಮಿಷಗಳ ನಂತರ ನೆನಪಿಸಿ" : "Remind me in 15 minutes"
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-white border-2 border-amber-400 text-amber-900 font-black text-xs hover:bg-amber-50 active:scale-95 transition-all text-center"
              >
                ⏰ ನಂತರ (Later)
              </button>
              <button
                type="button"
                onClick={() =>
                  handleProcessTranscript(
                    voiceLanguage === "kn" ? "ನನಗೆ ತುರ್ತು ಸಹಾಯ ಬೇಕು" : "I need help urgently"
                  )
                }
                className="py-2.5 px-3 rounded-xl bg-white border-2 border-rose-400 text-rose-900 font-black text-xs hover:bg-rose-50 active:scale-95 transition-all text-center"
              >
                🚨 ಸಹಾಯ (Help)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Highlight Banner if Voice Affirmative Triggered */}
      {highlightConfirmButton && (
        <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-400 flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
          <AlertTriangle className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-900">
            <span className="font-black block text-base">
              ಕ್ಲಿನಿಕಲ್ ಸುರಕ್ಷತೆ: ಮಾತ್ರೆ ದಾಖಲಿಸಲು ಕೆಳಗಿನ ಹಸಿರು ಬಟನ್ ಒತ್ತಿರಿ
            </span>
            <span>
              Clinical Safety Rule: Voice alone cannot record medication. Please tap the large green button below to confirm.
            </span>
          </div>
        </div>
      )}

      {/* Primary Action Hero Card (Senior-Centric Tap Target) */}
      {activeDose ? (
        <div
          className={`p-6 sm:p-8 rounded-3xl border-2 transition-all space-y-6 ${
            highlightConfirmButton
              ? "bg-emerald-50/90 border-emerald-500 ring-4 ring-emerald-400 shadow-xl"
              : activeDose.status === "TAKEN"
              ? "bg-emerald-50/70 border-emerald-300"
              : activeDose.status === "OVERDUE"
              ? "bg-rose-50/70 border-rose-300"
              : "bg-white border-[#1E3A2F] shadow-sm"
          }`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <span
                className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                  activeDose.status === "TAKEN"
                    ? "bg-emerald-100 text-emerald-900"
                    : activeDose.status === "OVERDUE"
                    ? "bg-rose-100 text-rose-900 animate-pulse"
                    : "bg-[#EBF2EE] text-[#1E3A2F]"
                }`}
              >
                {activeDose.status === "TAKEN"
                  ? "✓ ತೆಗೆದುಕೊಂಡಿದ್ದೀರಿ (Already Taken)"
                  : activeDose.status === "OVERDUE"
                  ? "⚠️ ಮರೆತುಹೋಗಿದೆ (Overdue Medication)"
                  : "ಮಾತ್ರೆ ಸಮಯ (Time for Medicine)"}
              </span>

              <h2 className="mt-3 text-2xl sm:text-3xl font-black text-[#1E3A2F]">
                {activeDose.medicationName} ({activeDose.dosageStrength})
              </h2>
              <p className="text-base sm:text-lg text-[#5C6460] font-medium mt-1">
                {activeDose.instructions || "Take with fresh water"} • {activeDose.mealTiming?.replace(/_/g, " ")}
              </p>
            </div>

            <div className="w-14 h-14 rounded-2xl bg-[#EBF2EE] text-[#1E3A2F] flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7" />
            </div>
          </div>

          {/* Large Senior Confirmation Button */}
          {activeDose.status !== "TAKEN" ? (
            <div className="space-y-2">
              <button
                ref={confirmButtonRef}
                onClick={() => handleMarkTaken(activeDose)}
                disabled={submitting}
                className={`w-full senior-touch-target py-5 sm:py-6 px-6 rounded-2xl text-white text-lg sm:text-xl font-black flex items-center justify-center gap-3 shadow-md hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer ${
                  highlightConfirmButton
                    ? "bg-emerald-700 hover:bg-emerald-800 ring-4 ring-emerald-300 animate-pulse"
                    : "bg-[#1E3A2F] hover:bg-[#162E25]"
                }`}
              >
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <span>
                  {submitting ? "ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ..." : "ನಾನು ತೆಗೆದುಕೊಂಡಿದ್ದೇನೆ (I Have Taken This)"}
                </span>
              </button>
              {highlightConfirmButton && (
                <p className="text-center text-xs font-black text-emerald-800 animate-bounce">
                  👇 ದೃಢೀಕರಿಸಲು ಇಲ್ಲಿ ಒತ್ತಿರಿ (Tap Here to Confirm)
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-100/70 border border-emerald-300 text-emerald-900 font-bold text-center flex items-center justify-center gap-2">
              <CheckCircle2 className="w-6 h-6 text-emerald-700" />
              <span>ಧನ್ಯವಾದಗಳು! ಇಂದಿನ ಡೋಸ್ ದೃಢೀಕರಿಸಲಾಗಿದೆ (Dose successfully recorded)</span>
            </div>
          )}

          {statusMessage && (
            <p className="text-center text-sm font-bold text-[#1E3A2F] animate-in fade-in">
              {statusMessage}
            </p>
          )}
        </div>
      ) : (
        <div className="p-8 text-center bg-white rounded-3xl border border-[#EFECE6] space-y-3">
          <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
          <h2 className="text-xl font-bold text-[#1E3A2F]">ಎಲ್ಲಾ ಮಾತ್ರೆಗಳನ್ನು ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ</h2>
          <p className="text-sm text-[#5C6460]">No pending doses scheduled for today for {patientDisplayName}.</p>
        </div>
      )}

      {/* Rest of Today's Doses */}
      <div className="space-y-4">
        <h3 className="text-lg font-black text-[#1E3A2F]">
          ಇಂದಿನ ಇತರ ಮಾತ್ರೆಗಳು (Other Medicines Today)
        </h3>
        <div className="space-y-3">
          {timeline.length > 0 ? (
            timeline.map((dose, index) => (
              <div
                key={index}
                className="p-4 sm:p-5 rounded-2xl bg-white border border-[#EFECE6] flex items-center justify-between"
              >
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] text-[#1E3A2F] flex items-center justify-center font-bold">
                    {dose.targetTime}
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-[#1E3A2F]">{dose.medicationName}</h4>
                    <p className="text-xs text-[#5C6460]">{dose.dosageStrength} • {dose.instructions}</p>
                  </div>
                </div>

                <span
                  className={`text-xs px-3 py-1 rounded-full font-bold ${
                    dose.status === "TAKEN"
                      ? "bg-emerald-100 text-emerald-900"
                      : dose.status === "OVERDUE"
                      ? "bg-rose-100 text-rose-900"
                      : "bg-[#EBF2EE] text-[#5C6460]"
                  }`}
                >
                  {dose.status === "TAKEN"
                    ? "ತೆಗೆದುಕೊಳ್ಳಲಾಗಿದೆ (Taken)"
                    : dose.status === "OVERDUE"
                    ? "ಬಾಕಿ ಇದೆ (Overdue)"
                    : "ಮುಂದಿನ ಡೋಸ್ (Upcoming)"}
                </span>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-xs text-[#5C6460] bg-[#FAF8F5] rounded-xl border border-[#EFECE6]">
              No scheduled medications found.
            </div>
          )}
        </div>
      </div>

      {/* Secondary Cards: Doctor Visit & Direct Companion Call */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-3xl bg-white border border-[#EFECE6] space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[#1E3A2F]">
              <Calendar className="w-5 h-5 text-[#607B6E]" />
              <h3 className="text-base font-extrabold">Next Doctor Visit (ವೈದ್ಯರ ಭೇಟಿ)</h3>
            </div>
            <div>
              <p className="text-lg font-black text-[#1E3A2F]">
                {activeProfile?.doctorName ? `Dr. ${activeProfile.doctorName}` : "Routine Health Checkup"}
              </p>
              <p className="text-sm text-[#5C6460]">
                {activeProfile?.hospitalName || "Bangalore Clinic"}
              </p>
            </div>
          </div>
          <div className="p-3 bg-[#FAF8F5] rounded-xl text-xs font-semibold text-[#1E3A2F] border border-[#EFECE6]">
            Companion: {emergencyName}
          </div>
        </div>

        {/* Emergency Assistance with Dynamic Family Contact */}
        <div className="p-6 rounded-3xl bg-[#FEF3C7] border border-amber-300 space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-amber-950">
              <PhoneCall className="w-5 h-5 text-amber-800" />
              <h3 className="text-base font-extrabold">Need Help? (ಸಹಾಯ ಬೇಕೇ?)</h3>
            </div>
            <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
              Tap below to directly call your emergency contact {emergencyName}.
            </p>
          </div>
          <a
            href={emergencyPhone ? `tel:${emergencyPhone.replace(/\s+/g, "")}` : "#"}
            className="w-full senior-touch-target py-3 px-4 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-bold text-center flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call {emergencyName} {emergencyPhone ? `(${emergencyPhone})` : ""}</span>
          </a>
        </div>
      </div>
    </div>
  );
}
