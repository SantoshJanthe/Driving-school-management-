"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/lib/database.types";

/**
 * Browser client. Only needed for flows that must run client-side (e.g. direct
 * file uploads to signed URLs). All CRUD goes through Server Actions.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
