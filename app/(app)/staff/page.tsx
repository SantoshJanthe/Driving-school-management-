import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Staff" };

export default async function StaffPage() {
  await requireAdmin();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Staff"
        description="Invite staff, set permissions and deactivate accounts."
      />
      <ComingSoon section="Staff management" milestone="Milestone 6 (admin & audit)" />
    </div>
  );
}
