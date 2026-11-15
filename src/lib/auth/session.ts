import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
}

/**
 * Retrieve authenticated user from active session cookie.
 * Returns null if not authenticated or if Supabase environment is unconfigured.
 */
export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return {
      id: user.id,
      email: user.email || "",
    };
  } catch (err) {
    console.error("[VATSALYA Session Error]", err);
    return null;
  }
}
