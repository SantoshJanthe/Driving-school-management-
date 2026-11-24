"use client";

import { createContext, useContext } from "react";

import type { Profile } from "@/lib/auth/get-profile";
import { can, isAdmin, type Permission } from "@/lib/auth/permissions";

const PermissionContext = createContext<{ profile: Profile; platformOwner: boolean } | null>(null);

/**
 * Makes the signed-in profile (role + permission toggles) available to client
 * components so they can hide nav items and buttons. Server-side guards and
 * RLS remain the enforcement layer; this is presentation only.
 */
export function PermissionProvider({
  profile,
  platformOwner = false,
  children,
}: {
  profile: Profile;
  platformOwner?: boolean;
  children: React.ReactNode;
}) {
  return (
    <PermissionContext.Provider value={{ profile, platformOwner }}>
      {children}
    </PermissionContext.Provider>
  );
}

export function useProfile(): Profile {
  const value = useContext(PermissionContext);
  if (!value) {
    throw new Error("useProfile must be used inside <PermissionProvider>");
  }
  return value.profile;
}

export function usePlatformOwner(): boolean {
  return useContext(PermissionContext)?.platformOwner ?? false;
}

export function useCan(key: Permission): boolean {
  return can(useProfile(), key);
}

export function useIsAdmin(): boolean {
  return isAdmin(useProfile());
}
