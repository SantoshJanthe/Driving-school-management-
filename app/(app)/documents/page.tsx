import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Documents" };

export default async function DocumentsPage() {
  await requirePermission("view_applicants");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Documents"
        description="Search and download uploaded documents across applicants."
      />
      <ComingSoon section="Documents" milestone="Milestone 5 (documents & history)" />
    </div>
  );
}
