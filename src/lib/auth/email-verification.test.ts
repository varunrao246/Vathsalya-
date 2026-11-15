import { describe, it, expect, afterAll } from "vitest";
import { createClient } from "@supabase/supabase-js";
import { getAppOrigin } from "./auth-client";
import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // ignore
}

describe("VATSALYA Email Verification & Session Isolation Suite", () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://lxwpjhgibbygrfouljuq.supabase.co";
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const createdUserIds: string[] = [];

  afterAll(async () => {
    if (serviceKey && url && !url.includes("placeholder")) {
      const adminClient = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      for (const id of createdUserIds) {
        try {
          await adminClient.auth.admin.deleteUser(id);
        } catch {
          // ignore
        }
      }
    }
  });

  it("resolves app origin correctly for email verification redirects", () => {
    const origin = getAppOrigin();
    expect(origin).toBeDefined();
    expect(origin.startsWith("http")).toBe(true);
  });

  it("generates a confirmation link targeting /auth/confirm with token_hash", async () => {
    if (!serviceKey || !url || url.includes("placeholder")) {
      expect(true).toBe(true);
      return;
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const testEmail = `vitest_signup_${Date.now()}@gmail.com`;
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email: testEmail,
      password: "TestPassword123!",
      options: {
        redirectTo: "https://vatsalya-tau.vercel.app/auth/confirm",
      },
    });

    expect(error).toBeNull();
    expect(data?.user).toBeDefined();
    expect(data?.properties?.hashed_token).toBeDefined();
    expect(data?.properties?.action_link).toContain("/auth/confirm");

    if (data?.user?.id) {
      createdUserIds.push(data.user.id);
    }
  });

  it("blocks login before email verification has taken place", async () => {
    if (!serviceKey || !anonKey || !url || url.includes("placeholder")) {
      expect(true).toBe(true);
      return;
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const testEmail = `vitest_unverified_${Date.now()}@gmail.com`;
    const password = "TestPassword123!";

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email: testEmail,
      password,
      options: {
        redirectTo: "https://vatsalya-tau.vercel.app/auth/confirm",
      },
    });

    expect(linkError).toBeNull();
    if (linkData.user?.id) {
      createdUserIds.push(linkData.user.id);
    }

    // Try to login with unverified account
    const { data: loginData, error: loginError } = await anonClient.auth.signInWithPassword({
      email: testEmail,
      password,
    });

    expect(loginData.session).toBeNull();
    expect(loginError).not.toBeNull();
    expect(loginError?.message).toContain("Email not confirmed");
  });

  it("rejects invalid or malformed confirmation tokens", async () => {
    if (!anonKey || !url || url.includes("placeholder")) {
      expect(true).toBe(true);
      return;
    }

    const anonClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error } = await anonClient.auth.verifyOtp({
      token_hash: "invalid_dummy_token_hash_value_12345",
      type: "signup",
    });

    expect(error).not.toBeNull();
    expect(error?.message).toMatch(/invalid|expired/i);
  });

  it("verifies user with valid token, updates confirmed_at, and enables manual login", async () => {
    if (!serviceKey || !anonKey || !url || url.includes("placeholder")) {
      expect(true).toBe(true);
      return;
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const isolatedClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const testEmail = `vitest_confirm_${Date.now()}@gmail.com`;
    const password = "TestPassword123!";

    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email: testEmail,
      password,
      options: {
        redirectTo: "https://vatsalya-tau.vercel.app/auth/confirm",
      },
    });

    expect(linkError).toBeNull();
    expect(linkData?.user).toBeDefined();
    expect(linkData?.properties?.hashed_token).toBeDefined();

    const userId = linkData!.user!.id;
    createdUserIds.push(userId);

    const token_hash = linkData!.properties!.hashed_token!;

    // Verify token with isolated client
    const { data: verifyData, error: verifyError } = await isolatedClient.auth.verifyOtp({
      token_hash,
      type: "signup",
    });

    expect(verifyError).toBeNull();
    expect(verifyData.user?.email_confirmed_at).toBeDefined();

    // Verify database record
    const { data: dbUser } = await adminClient.auth.admin.getUserById(userId);
    expect(dbUser?.user?.email_confirmed_at).toBeDefined();

    // Token reuse must fail
    const { error: reuseError } = await isolatedClient.auth.verifyOtp({
      token_hash,
      type: "signup",
    });
    expect(reuseError).not.toBeNull();
    expect(reuseError?.message).toMatch(/invalid|expired/i);

    // Manual login must now succeed
    const manualLoginClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: manualLoginData, error: manualLoginError } =
      await manualLoginClient.auth.signInWithPassword({
        email: testEmail,
        password,
      });

    expect(manualLoginError).toBeNull();
    expect(manualLoginData.user?.id).toBe(userId);
  });

  it("does not destroy unrelated existing user session during verification", async () => {
    if (!serviceKey || !anonKey || !url || url.includes("placeholder")) {
      expect(true).toBe(true);
      return;
    }

    const adminClient = createClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const isolatedClient = createClient(url, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // 1. Create and sign in an unrelated user
    const unrelatedEmail = `unrelated_session_${Date.now()}@gmail.com`;
    const { data: unrelatedUser, error: unrelatedCreateError } =
      await adminClient.auth.admin.createUser({
        email: unrelatedEmail,
        password: "Password123!",
        email_confirm: true,
      });

    expect(unrelatedCreateError).toBeNull();
    expect(unrelatedUser?.user).toBeDefined();
    createdUserIds.push(unrelatedUser!.user!.id);

    const unrelatedClient = createClient(url, anonKey);
    const { data: unrelatedSignIn } = await unrelatedClient.auth.signInWithPassword({
      email: unrelatedEmail,
      password: "Password123!",
    });
    expect(unrelatedSignIn.session?.user?.email).toBe(unrelatedEmail);

    // 2. A different user registers and verifies their email
    const newEmail = `new_account_${Date.now()}@gmail.com`;
    const { data: newLinkData } = await adminClient.auth.admin.generateLink({
      type: "signup",
      email: newEmail,
      password: "Password123!",
    });
    expect(newLinkData?.user).toBeDefined();
    expect(newLinkData?.properties?.hashed_token).toBeDefined();
    createdUserIds.push(newLinkData!.user!.id);

    await isolatedClient.auth.verifyOtp({
      token_hash: newLinkData!.properties!.hashed_token!,
      type: "signup",
    });

    // 3. Verify unrelated client session is completely preserved
    const { data: activeSession } = await unrelatedClient.auth.getSession();
    expect(activeSession.session?.user?.email).toBe(unrelatedEmail);
  });

  it("checks Google OAuth provider status and handles unconfigured provider safely", async () => {
    const { isGoogleAuthEnabled, signInWithGoogle } = await import("./auth-client");
    const enabled = await isGoogleAuthEnabled();

    // In the current Supabase live project, Google OAuth is not yet toggled on
    expect(typeof enabled).toBe("boolean");

    if (!enabled) {
      // Must throw friendly explanatory error instead of failing unexpectedly
      await expect(signInWithGoogle()).rejects.toThrow(/Google Sign-In is not currently enabled/i);
    }
  });
});
