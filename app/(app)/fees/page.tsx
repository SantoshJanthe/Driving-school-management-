import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { requirePermission } from "@/lib/auth/guards";
import { formatINR, formatPhone } from "@/lib/format";
import { listOutstandingBalances } from "@/lib/queries/fees";

export const metadata: Metadata = { title: "Fee reminders" };

export default async function FeesPage() {
  await requirePermission("view_financials");
  const rows = await listOutstandingBalances();

  return (
    <div className="grid gap-5">
      <PageHeader
        title="Fee reminders"
        description="Students who still owe a balance. Open a receipt to print or download it."
      />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">No outstanding balances.</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-medium">{row.full_name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatPhone(row.phone)}
                  {row.license_category ? ` · ${row.license_category}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-lg font-medium">{formatINR(row.balance_due)}</p>
                <Link href={`/applicants/${row.id}/receipt`} className="text-sm underline-offset-4 hover:underline">
                  Receipt
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
