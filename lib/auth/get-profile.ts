import { cache } from "react";

import { parsePermissions, type Permissions, type Role } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  school_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  permissions: Permissions;
  is_active: boolean;
  last_login_at: string | null;
};

/**
 * Loads the signed-in user's profile once per request (React `cache`). Uses the
 * `current_profile()` RPC, which is SECURITY DEFINER so it still returns the
 * row for a deactivated user — RLS would hide it, and we need `is_active` to
 * show the right message.
 *
 * Returns `null` when there is no session or no profile row.
 */
export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("current_profile");
  if (error || !data || !data.id) return null;

  return {
    id: data.id,
    school_id: data.school_id,
    full_name: data.full_name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    permissions: parsePermissions(data.permissions),
    is_active: data.is_active,
    last_login_at: data.last_login_at,
  };
});
