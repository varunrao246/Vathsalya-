/**
 * Gnani.ai Conversational Voice Integration (Prisma STT & Timbre TTS)
 * With graceful fallback to Web Speech API / native synthesis.
 */

const GNANI_API_KEY = process.env.GNANI_API_KEY || "";
const GNANI_TTS_ENDPOINT = process.env.GNANI_TTS_ENDPOINT || "https://api.gnani.ai/vach/tts";
const GNANI_STT_ENDPOINT = process.env.GNANI_STT_ENDPOINT || "https://api.gnani.ai/vach/stt";

export interface GnaniTTSOptions {
  text: string;
  language: "kn" | "en";
  gender?: "female" | "male";
}

export interface GnaniTTSResult {
  success: boolean;
  audioBase64?: string;
  source: "GNANI_TIMBRE" | "FALLBACK_WEB_SPEECH";
  error?: string;
}

/**
 * Synthesizes speech using Gnani.ai Timbre TTS.
 * Gracefully falls back to browser TTS if Gnani service is unreachable or unconfigured.
 */
export async function synthesizeGnaniTTS(options: GnaniTTSOptions): Promise<GnaniTTSResult> {
  if (!GNANI_API_KEY) {
    return {
      success: true,
      source: "FALLBACK_WEB_SPEECH",
    };
  }

  try {
    const langCode = options.language === "kn" ? "kan" : "eng";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000); // 4-second timeout for clinical responsiveness

    const res = await fetch(GNANI_TTS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GNANI_API_KEY,
        "token": GNANI_API_KEY,
      },
      body: JSON.stringify({
        text: options.text,
        language: langCode,
        gender: options.gender || "female",
        format: "mp3",
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const buffer = await res.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      return {
        success: true,
        audioBase64: `data:audio/mp3;base64,${base64}`,
        source: "GNANI_TIMBRE",
      };
    }

    return {
      success: true,
      source: "FALLBACK_WEB_SPEECH",
      error: `Gnani TTS returned ${res.status}`,
    };
  } catch (err: unknown) {
    return {
      success: true,
      source: "FALLBACK_WEB_SPEECH",
      error: err instanceof Error ? err.message : "Gnani connection failed",
    };
  }
}

/**
 * Transcribes audio using Gnani.ai Prisma STT.
 * Returns transcript with graceful fallback.
 */
export async function transcribeGnaniSTT(
  audioBase64: string,
  language: "kn" | "en"
): Promise<{ success: boolean; transcript?: string; source: string }> {
  if (!GNANI_API_KEY || !audioBase64) {
    return { success: false, source: "FALLBACK_BROWSER_STT" };
  }

  try {
    const langCode = optionsLanguage(language);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(GNANI_STT_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": GNANI_API_KEY,
        "token": GNANI_API_KEY,
      },
      body: JSON.stringify({
        audio: audioBase64,
        language: langCode,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (res.ok) {
      const json = await res.json();
      return {
        success: true,
        transcript: json.transcript || json.text || "",
        source: "GNANI_PRISMA",
      };
    }

    return { success: false, source: "FALLBACK_BROWSER_STT" };
  } catch {
    return { success: false, source: "FALLBACK_BROWSER_STT" };
  }
}

function optionsLanguage(lang: "kn" | "en"): string {
  return lang === "kn" ? "kan" : "eng";
}
