import type { Metadata } from "next";

import { ComingSoon } from "@/components/layout/coming-soon";
import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";

export const metadata: Metadata = { title: "Payments" };

export default async function PaymentsPage() {
  await requirePermission("view_financials");

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Payments"
        description="School-wide payment ledger and outstanding balances."
      />
      <ComingSoon section="Payments" milestone="Milestone 4 (training & payments)" />
    </div>
  );
}
