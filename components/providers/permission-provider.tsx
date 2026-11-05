"use client";

import { createContext, useContext } from "react";

import type { Profile } from "@/lib/auth/get-profile";
import { can, isAdmin, type Permission } from "@/lib/auth/permissions";

const PermissionContext = createContext<Profile | null>(null);

/**
 * Makes the signed-in profile (role + permission toggles) available to client
 * components so they can hide nav items and buttons. Server-side guards and
 * RLS remain the enforcement layer; this is presentation only.
 */
export function PermissionProvider({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  return <PermissionContext.Provider value={profile}>{children}</PermissionContext.Provider>;
}

export function useProfile(): Profile {
  const profile = useContext(PermissionContext);
  if (!profile) {
    throw new Error("useProfile must be used inside <PermissionProvider>");
  }
  return profile;
}

export function useCan(key: Permission): boolean {
  return can(useProfile(), key);
}

export function useIsAdmin(): boolean {
  return isAdmin(useProfile());
}
