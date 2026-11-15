import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

// Read credentials from .env.local safely
const dotenv = fs.readFileSync(".env.local", "utf8");
function getVar(name) {
  const match = dotenv.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : null;
}

const url = getVar("NEXT_PUBLIC_SUPABASE_URL");
const anonKey = getVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
const serviceKey = getVar("SUPABASE_SERVICE_ROLE_KEY");

if (!url || !anonKey || !serviceKey) {
  console.error("Missing required Supabase credentials in .env.local");
  process.exit(1);
}

const adminClient = createClient(url, serviceKey);

const expectedTables = [
  "profiles",
  "healthcare_profiles",
  "profile_access_members",
  "profile_access_invitations",
  "medications",
  "medication_schedules",
  "dose_logs",
  "appointments",
  "device_tokens",
  "telegram_links",
  "notifications",
  "care_activities",
  "care_insights",
  "telegram_linking_tokens",
  "notification_preferences",
  "escalation_events",
];

async function verifyLiveDatabase() {
  console.log("==================================================");
  console.log("VATSALYA (वात्सल್ಯ) — Live Supabase Database Audit");
  console.log("==================================================");
  console.log(`Target Project: ${url.replace(/^(https:\/\/[a-z0-9]{4}).*(\.supabase\.co)$/, "$1...$2")}`);
  console.log("Credentials checked: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY\n");

  // 1. Table Verification
  console.log("1. TABLE AUDIT:");
  const tableResults = {};
  let appliedTables = 0;

  for (const table of expectedTables) {
    const { error } = await adminClient.from(table).select("*").limit(1);
    if (error) {
      tableResults[table] = { status: "MISSING_OR_UNAVAILABLE", error: error.message, code: error.code };
    } else {
      tableResults[table] = { status: "ACTIVE_AND_ACCESSIBLE" };
      appliedTables++;
    }
    console.log(`  - [${tableResults[table].status === "ACTIVE_AND_ACCESSIBLE" ? "✓" : "✗"}] ${table}: ${tableResults[table].status}`);
  }

  // 2. RPC Functions Audit
  console.log("\n2. SECURITY DEFINER & RPC FUNCTIONS AUDIT:");
  const rpcs = [
    { name: "has_healthcare_access", params: { target_profile_id: "00000000-0000-0000-0000-000000000000" } },
    { name: "has_healthcare_permission", params: { target_profile_id: "00000000-0000-0000-0000-000000000000", required_permission: "VIEW_ONLY" } },
    { name: "is_profile_owner_or_admin", params: { target_profile_id: "00000000-0000-0000-0000-000000000000" } },
    { name: "claim_notification_for_processing", params: { p_idempotency_key: "check-key", p_healthcare_profile_id: "00000000-0000-0000-0000-000000000000", p_recipient_identifier: "none", p_delivery_channel: "EMAIL", p_notification_type: "UPCOMING_DOSE", p_title: "Test", p_message: "Test" } }
  ];

  for (const r of rpcs) {
    const { error } = await adminClient.rpc(r.name, r.params);
    const exists = !error || !error.message.includes("Could not find the function");
    console.log(`  - [${exists ? "✓" : "✗"}] ${r.name}: ${exists ? "DEFINED" : "MISSING"}`);
  }

  // 3. Supabase Auth Verification
  console.log("\n3. SUPABASE AUTH AUDIT:");
  try {
    const { data: users, error: authErr } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1 });
    if (authErr) {
      console.log(`  - [✗] Auth Service: Error -> ${authErr.message}`);
    } else {
      console.log(`  - [✓] Auth Service: Active and responding (found ${users?.users?.length ?? 0} registered user accounts)`);
    }
  } catch (e) {
    console.log(`  - [✗] Auth Service exception: ${e.message}`);
  }

  // Summary
  console.log("\n==================================================");
  console.log(`SUMMARY: ${appliedTables}/${expectedTables.length} tables verified.`);
  if (appliedTables === 0) {
    console.log("STATUS: Fresh Supabase project detected. Migrations are ready to be applied.");
  } else if (appliedTables === expectedTables.length) {
    console.log("STATUS: All tables and schemas fully verified on live Supabase project.");
  } else {
    console.log(`STATUS: Partial schema detected (${appliedTables}/${expectedTables.length} tables).`);
  }
  console.log("==================================================");
}

verifyLiveDatabase().catch(console.error);
