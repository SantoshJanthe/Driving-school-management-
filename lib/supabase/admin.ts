import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/database.types";
import { env } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS, so it is restricted to operations that
 * Supabase Auth requires it for: inviting staff, banning/unbanning users on
 * deactivation and revoking sessions. Never import this from client code —
 * the `server-only` import makes that a build error.
 */
export function createAdminClient() {
  return createClient<Database>(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
