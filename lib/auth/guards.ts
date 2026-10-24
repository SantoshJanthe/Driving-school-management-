import "server-only";

import { redirect } from "next/navigation";

import { getProfile, type Profile } from "@/lib/auth/get-profile";
import { can, type Permission } from "@/lib/auth/permissions";

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
