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
    if (error.message.includes("rate limit") || error.status === 429) {
      throw new Error("Please wait a moment before requesting another confirmation email.");
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
