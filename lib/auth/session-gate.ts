import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import {
  DEACTIVATED_MESSAGE,
  NO_PROFILE_MESSAGE,
  SCHOOL_SUSPENDED_MESSAGE,
} from "@/lib/auth/messages";
import type { Database } from "@/lib/database.types";
import { isPlatformOwner } from "@/lib/subscription/config";

export type SessionDenial = "no_profile" | "deactivated" | "school_suspended";

export const DENIAL_MESSAGES: Record<SessionDenial, string> = {
  no_profile: NO_PROFILE_MESSAGE,
  deactivated: DEACTIVATED_MESSAGE,
  school_suspended: SCHOOL_SUSPENDED_MESSAGE,
};

/**
 * Decides whether a freshly authenticated session may continue. Shared by the
 * password form and the Google callback so both doors apply the same rules:
 * a profile must exist, be active, and belong to a school the software owner
 * has not suspended. The owner's own session is never suspended, otherwise a
 * mistake would lock them out of the control plane.
 */
export async function denySession(
  supabase: SupabaseClient<Database>,
  email: string | null | undefined,
): Promise<SessionDenial | null> {
  const { data: profile } = await supabase.rpc("current_profile");
  if (!profile || !profile.id) return "no_profile";
  if (!profile.is_active) return "deactivated";

  if (isPlatformOwner(email)) return null;

  const { data: access } = await supabase.rpc("current_school_access");
  if (access && typeof access === "object" && !Array.isArray(access)) {
    if ((access as Record<string, unknown>).is_active === false) return "school_suspended";
  }
  return null;
}
