import { headers } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

/**
 * Retrieve authenticated user from active session cookie or Authorization Bearer token.
 * Returns null if not authenticated or if Supabase environment is unconfigured.
 */
export async function getAuthUser(): Promise<AuthenticatedUser | null> {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return null;
  }

  try {
    let token: string | undefined;
    try {
      const headerList = await headers();
      const authHeader = headerList.get("authorization");
      if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
        token = authHeader.slice(7).trim();
      }
    } catch {
      // In testing environments or static contexts where headers() may be unavailable
    }

    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return null;
    }

    const meta = user.user_metadata || {};
    const fullName = (meta.full_name || meta.name || "") as string;
    const avatarUrl = (meta.avatar_url || "") as string;

    return {
      id: user.id,
      email: user.email || "",
      fullName: fullName || undefined,
      avatarUrl: avatarUrl || undefined,
    };
  } catch (err) {
    console.error("[VATSALYA Session Error]", err);
    return null;
  }
}
