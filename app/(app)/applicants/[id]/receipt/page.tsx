import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintButton } from "@/components/fees/print-button";
import { requirePermission } from "@/lib/auth/guards";
import { formatDate, formatINR, formatPhone } from "@/lib/format";
import { getReceipt } from "@/lib/queries/fees";

export const metadata: Metadata = { title: "Receipt" };

export default async function ReceiptPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("view_financials");
  const { id } = await params;
  const receipt = await getReceipt(id);
  if (!receipt) notFound();
  const { applicant, school, payments } = receipt;

  return (
    <article className="mx-auto grid max-w-2xl gap-6 bg-white p-6 text-[#1a1916] print:max-w-none">
      <div className="flex flex-wrap items-start justify-between gap-3 print:hidden">
        <Link href="/fees" className="text-sm text-muted-foreground hover:underline">
          ‹ Fee reminders
        </Link>
        <div className="flex gap-2">
          <PrintButton />
          <a
            href={`/api/receipts/${applicant.id}`}
            className="border-input inline-flex h-11 items-center rounded-lg border px-4 text-sm"
          >
            Download
          </a>
        </div>
      </div>
      <header className="grid gap-1 border-b pb-4">
        <p className="text-lg font-semibold">{school?.name ?? "School"}</p>
        <p className="text-sm">{school?.address}</p>
        <p className="text-sm">{school?.contact_phone ? formatPhone(school.contact_phone) : null}</p>
        <h1 className="mt-3 text-xl font-medium">Fee receipt</h1>
      </header>
      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Student</dt>
          <dd>{applicant.full_name}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{formatPhone(applicant.phone)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Course</dt>
          <dd>{applicant.license_category ?? "—"}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Balance</dt>
          <dd>{formatINR(applicant.balance_due)}</dd>
        </div>
      </dl>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Date</th>
            <th>Mode</th>
            <th>Receipt</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b">
              <td className="py-2">{formatDate(payment.payment_date)}</td>
              <td>{payment.payment_mode}</td>
              <td>{payment.receipt_number ?? "—"}</td>
              <td className="text-right">{formatINR(payment.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-sm">
        Total fee {formatINR(applicant.total_fee)} · Paid {formatINR(applicant.amount_paid)} · Balance{" "}
        {formatINR(applicant.balance_due)}
      </p>
    </article>
  );
}
