import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Applicants" };

export default async function ApplicantsPage() {
  await requirePermission("view_applicants");

  return (
    <div className="grid gap-6">
      <PageHeader title="Applicants" description="Create, edit and search applicant records." />
      <ComingSoon section="Applicants" milestone="Milestone 3 (applicant management)" />
    </div>
  );
}
