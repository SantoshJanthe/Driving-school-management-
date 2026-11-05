import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatINR } from "@/lib/format";
import { getSchoolReport } from "@/lib/queries/reports";

export const metadata: Metadata = { title: "Reports" };

export default async function ReportsPage() {
  await requirePermission("view_financials");
  const report = await getSchoolReport();

  return (
    <div className="grid gap-5">
      <PageHeader title="Reports" description="This month, for your school only." />
      <dl className="grid gap-3 sm:grid-cols-2">
        {[
          ["Admissions this month", String(report.admissions)],
          ["Fees collected", formatINR(report.collected)],
          ["Pending balances", formatINR(report.pending)],
          ["Lessons completed", String(report.lessons)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl border bg-[#fffcf7] p-5">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
            <dd className="mt-2 text-3xl font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
