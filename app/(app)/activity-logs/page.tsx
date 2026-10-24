import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Activity logs" };

export default async function ActivityLogsPage() {
  await requireAdmin();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Activity logs"
        description="Activity and audit trails with filters and export."
      />
      <ComingSoon section="Activity logs" milestone="Milestone 6 (admin & audit)" />
    </div>
  );
}
