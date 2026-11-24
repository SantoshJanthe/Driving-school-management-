import "server-only";

import { redirect } from "next/navigation";

import { getProfile, type Profile } from "@/lib/auth/get-profile";
import { can, type Permission } from "@/lib/auth/permissions";
import { getSchoolAccess } from "@/lib/auth/school-access";
import { isPlatformOwner } from "@/lib/subscription/config";
import { createClient } from "@/lib/supabase/server";

/** Email on the current session, or null. */
async function signedInEmail(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ?? null;
}

/**
 * Route-guard helpers for Server Components / Server Actions. They are UX
 * guards only — Row Level Security in Postgres is what actually enforces access.
 *
 * Usage in a page:
 *   const profile = await requirePermission("view_applicants");
 *   const profile = await requireAdmin();
 */

/** Signed-in and active, otherwise redirect to login (forced sign-out if deactivated). */
export async function requireProfile(): Promise<Profile> {
  const profile = await getProfile();
  if (!profile) redirect("/auth/signout?reason=no_profile");
  if (!profile.is_active) redirect("/auth/signout?reason=deactivated");

  const access = await getSchoolAccess();
  if (access && !access.is_active && !isPlatformOwner(await signedInEmail())) {
    redirect("/auth/signout?reason=school_suspended");
  }
  return profile;
}

export async function requireAdmin(): Promise<Profile> {
  const profile = await requireProfile();
  if (profile.role !== "admin") redirect("/dashboard?denied=admin");
  return profile;
}

export async function requirePermission(key: Permission): Promise<Profile> {
  const profile = await requireProfile();
  if (!can(profile, key)) redirect(`/dashboard?denied=${key}`);
  return profile;
}

/** Software owner listed in PLATFORM_OWNER_EMAILS. */
export async function requirePlatformOwner(): Promise<Profile> {
  const profile = await requireProfile();
  if (!isPlatformOwner(await signedInEmail())) redirect("/dashboard?denied=vendor");
  return profile;
}
