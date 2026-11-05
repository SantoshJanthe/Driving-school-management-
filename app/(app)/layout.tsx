import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { PermissionProvider } from "@/components/providers/permission-provider";
import { requireProfile } from "@/lib/auth/guards";
import { isInstructorOnly } from "@/lib/auth/permissions";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated shell. `requireProfile()` sends anonymous users to /login and
 * deactivated users through a forced sign-out; the profile is loaded once per
 * request and shared with client components via <PermissionProvider>.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();
  const pathname = (await headers()).get("x-pathname") ?? "";
  if (
    (profile.role === "student" || isInstructorOnly(profile)) &&
    pathname !== "/dashboard" &&
    pathname !== "/settings" &&
    !(profile.role === "student" && pathname === "/my-receipt") &&
    !pathname.startsWith("/api/documents") &&
    !(profile.role === "student" && pathname.startsWith("/api/receipts"))
  ) {
    redirect("/dashboard");
  }

  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("id", profile.school_id)
    .maybeSingle();

  return (
    <PermissionProvider profile={profile}>
      <AppShell schoolName={school?.name ?? env.appName}>{children}</AppShell>
    </PermissionProvider>
  );
}
