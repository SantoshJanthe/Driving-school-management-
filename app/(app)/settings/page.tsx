import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireProfile } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireProfile();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Settings"
        description="School details, your account and security settings."
      />
      <ComingSoon section="Settings" milestone="Milestone 6 (admin & audit)" />
    </div>
  );
}
