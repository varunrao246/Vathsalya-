import { createClient } from "@/lib/supabase/client";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder")
  );
}

export function getAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  if (process.env.NEXT_PUBLIC_APP_URL && !process.env.NEXT_PUBLIC_APP_URL.includes("localhost")) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }
  return "https://vatsalya-tau.vercel.app";
}

export async function signInWithEmail(email: string, password: string) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase credentials are not yet configured. Please provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live authentication."
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    if (error.message.includes("Email not confirmed")) {
      throw new Error(
        "Email not verified. Please check your inbox for the confirmation link, or use the resend option below."
      );
    }
    if (error.message.includes("Invalid login credentials")) {
      throw new Error("Invalid email or password. Please verify your credentials and try again.");
    }
    throw error;
  }

  return data;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  metadata: {
    fullName: string;
    phone?: string;
    preferredLanguage?: string;
    redirectTo?: string;
  }
) {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase credentials are not yet configured. Please provide NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to enable live registration."
    );
  }

  const cleanEmail = email.trim().toLowerCase();
  const origin = getAppOrigin();
  const emailRedirectTo = metadata.redirectTo || `${origin}/auth/confirm`;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      emailRedirectTo,
      data: {
        full_name: metadata.fullName.trim(),
        phone: metadata.phone?.trim(),
        preferred_language: metadata.preferredLanguage || "kn",
      },
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      throw new Error("An account with this email address already exists. Please sign in instead.");
    }
    if (error.message.includes("Password should be")) {
      throw new Error("Password must be at least 8 characters long.");
    }
    if (error.message.toLowerCase().includes("rate limit") || (error as { status?: number }).status === 429) {
      throw new Error(
        "The built-in email service has reached its hourly quota (3–4 emails/hour). Please wait a while before requesting another email, or explore the platform using the Demo Sandbox."
      );
    }
    throw error;
  }

  // Supabase Auth returns empty identities array when email is already registered and email confirmation is on
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error("An account with this email address already exists. Please sign in instead.");
  }

  return data;
}

export async function resendVerificationEmail(email: string) {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase credentials are not configured.");
  }

  const cleanEmail = email.trim().toLowerCase();
  const origin = getAppOrigin();
  const emailRedirectTo = `${origin}/auth/confirm`;

  const supabase = createClient();
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email: cleanEmail,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    if (error.message.toLowerCase().includes("rate limit") || (error as { status?: number }).status === 429) {
      throw new Error(
        "The built-in email service has reached its hourly quota (3–4 emails/hour). Please wait a while before requesting another email, or explore the platform using the Demo Sandbox."
      );
    }
    throw error;
  }

  return data;
}

export async function isGoogleAuthEnabled(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("placeholder")) {
      return false;
    }
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: { apikey: supabaseAnonKey },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Boolean(data.external?.google);
  } catch {
    return false;
  }
}

export async function signInWithGoogle() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase credentials are not configured. Please check your configuration."
    );
  }

  // Pre-flight check: verify if Google provider is enabled in the live Supabase project
  const isEnabled = await isGoogleAuthEnabled();
  if (!isEnabled) {
    throw new Error(
      "Google Sign-In is not currently enabled in the Supabase project. To enable it, navigate to Supabase Dashboard -> Authentication -> Providers -> Google, toggle it on, and supply the Google Client ID and Secret. In the meantime, please register or sign in using Email and Password."
    );
  }

  const origin = getAppOrigin();
  const redirectTo = `${origin}/auth/callback?next=/onboard`;

  const supabase = createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        access_type: "offline",
        prompt: "consent",
      },
    },
  });

  if (error) {
    if (
      error.message.toLowerCase().includes("provider is not enabled") ||
      error.message.toLowerCase().includes("unsupported provider")
    ) {
      throw new Error(
        "Google Sign-In is not currently enabled in the Supabase project. To enable it, navigate to Supabase Dashboard -> Authentication -> Providers -> Google, toggle it on, and supply the Google Client ID and Secret. In the meantime, please register or sign in using Email and Password."
      );
    }
    throw error;
  }

  return data;
}

export async function signOutUser() {
  if (!isSupabaseConfigured()) {
    return;
  }

  const supabase = createClient();
  await supabase.auth.signOut();
}
