import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/session";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, preferred_language, avatar_url, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (profile) {
    // If full_name was empty in profile record but available in auth metadata, update it
    if (!profile.full_name?.trim() && user.fullName) {
      profile.full_name = user.fullName;
      const admin = createAdminClient();
      await admin.from("profiles").update({ full_name: user.fullName }).eq("id", user.id);
    }
    return NextResponse.json({ success: true, data: profile }, { status: 200 });
  }

  // Profile row does not exist yet (e.g. freshly created OAuth user)
  const resolvedName = user.fullName || (user.email ? user.email.split("@")[0] : "Your Account");
  const admin = createAdminClient();
  const { data: createdProfile } = await admin
    .from("profiles")
    .upsert(
      {
        id: user.id,
        email: user.email,
        full_name: resolvedName,
        avatar_url: user.avatarUrl || null,
        preferred_language: "en",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" }
    )
    .select()
    .single();

  return NextResponse.json(
    {
      success: true,
      data: createdProfile || {
        id: user.id,
        email: user.email,
        full_name: resolvedName,
        phone: null,
        preferred_language: "en",
        avatar_url: user.avatarUrl || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    },
    { status: 200 }
  );
}

export async function POST(req: Request) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authentication required." } },
      { status: 401 }
    );
  }

  try {
    const body = await req.json();
    const { fullName, phone, preferredLanguage, avatarUrl } = body;

    if (!fullName || typeof fullName !== "string") {
      return NextResponse.json(
        { success: false, error: { code: "VALIDATION_ERROR", message: "fullName is required." } },
        { status: 400 }
      );
    }

    const admin = createAdminClient();
    const { data: profile, error } = await admin
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name: fullName.trim(),
        phone: phone ? String(phone).trim() : null,
        preferred_language: preferredLanguage === "kn" || preferredLanguage === "hi" ? preferredLanguage : "en",
        avatar_url: avatarUrl ? String(avatarUrl).trim() : null,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, data: profile }, { status: 200 });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: err instanceof Error ? err.message : "Invalid payload" } },
      { status: 400 }
    );
  }
}
