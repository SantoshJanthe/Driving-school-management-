import "server-only";

import { cache } from "react";

import { createClient } from "@/lib/supabase/server";

export type SchoolAccess = {
  school_id: string;
  name: string;
  is_active: boolean;
};

/**
 * Access state of the signed-in user's school. Read through a SECURITY DEFINER
 * RPC because a suspended school is invisible to its own members under RLS —
 * that is exactly the case where the app needs to say what happened.
 */
export const getSchoolAccess = cache(async (): Promise<SchoolAccess | null> => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("current_school_access");
  if (!data || typeof data !== "object" || Array.isArray(data)) return null;
  const row = data as Record<string, unknown>;
  if (typeof row.school_id !== "string") return null;
  return {
    school_id: row.school_id,
    name: typeof row.name === "string" ? row.name : "",
    is_active: row.is_active !== false,
  };
});
