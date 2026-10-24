import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Training" };

export default async function TrainingPage() {
  await requirePermission("view_applicants");

  return (
    <div className="grid gap-6">
      <PageHeader title="Training" description="Training sessions by day across all applicants." />
      <ComingSoon section="Training" milestone="Milestone 4 (training & payments)" />
    </div>
  );
}
