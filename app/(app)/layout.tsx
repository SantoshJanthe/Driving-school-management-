import { AppShell } from "@/components/layout/app-shell";
import { PermissionProvider } from "@/components/providers/permission-provider";
import { requireProfile } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/**
 * Authenticated shell. `requireProfile()` sends anonymous users to /login and
 * deactivated users through a forced sign-out; the profile is loaded once per
 * request and shared with client components via <PermissionProvider>.
 */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireProfile();

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
