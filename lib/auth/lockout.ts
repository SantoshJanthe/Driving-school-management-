import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

const LIMIT = 5;
const LOCK_MS = 15 * 60 * 1000;

/** Message when this email is temporarily blocked, otherwise null. */
export async function loginLockMessage(email: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin.from("login_locks").select("locked_until").eq("email", email).maybeSingle();
  if (data?.locked_until && new Date(data.locked_until).getTime() > Date.now()) {
    return "Too many attempts for this email. Try again in 15 minutes.";
  }
  return null;
}

/** Counts a failed sign-in. Returns true when this attempt starts the lock. */
export async function recordFailedLogin(email: string): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("login_locks")
    .select("failures")
    .eq("email", email)
    .maybeSingle();
  const failures = (data?.failures ?? 0) + 1;
  const locked = failures >= LIMIT;
  await admin.from("login_locks").upsert({
    email,
    failures: locked ? 0 : failures,
    locked_until: locked ? new Date(Date.now() + LOCK_MS).toISOString() : null,
    updated_at: new Date().toISOString(),
  });
  return locked;
}

export async function clearLoginLock(email: string) {
  const admin = createAdminClient();
  await admin.from("login_locks").delete().eq("email", email);
}
