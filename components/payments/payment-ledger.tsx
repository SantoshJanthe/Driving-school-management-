import Link from "next/link";
import { Fragment } from "react";

import { EditPaymentForm } from "@/components/payments/edit-payment-form";
import { formatDate, formatINR } from "@/lib/format";
import type { LedgerRow } from "@/lib/queries/payments";

export function PaymentLedger({ rows, canEdit = false }: { rows: LedgerRow[]; canEdit?: boolean }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-lg font-semibold">Recorded payments</h2>
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          No payments recorded yet. Record a cash, UPI, bank, or card payment above.
        </p>
      ) : (
        <div className="overflow-hidden rounded-xl border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Applicant</th>
                <th className="px-4 py-3 font-medium">Mode</th>
                <th className="px-4 py-3 font-medium">Receipt</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <Fragment key={row.id}>
                <tr className="border-t">
                  <td className="px-4 py-3 whitespace-nowrap">{formatDate(row.payment_date)}</td>
                  <td className="px-4 py-3">
                    {row.applicant_id ? (
                      <Link href={`/applicants/${row.applicant_id}`} className="hover:underline">
                        {row.applicant_name}
                      </Link>
                    ) : (
                      (row.applicant_name ?? "—")
                    )}
                  </td>
                  <td className="px-4 py-3 capitalize">{row.payment_mode}</td>
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {row.receipt_number ?? row.remarks ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatINR(row.amount)}</td>
                </tr>
                {canEdit ? (
                  <tr key={`${row.id}-edit`} className="border-t bg-[#fffcf7]">
                    <td colSpan={5} className="px-4 py-3">
                      <EditPaymentForm
                        id={row.id}
                        amount={row.amount}
                        paymentDate={row.payment_date}
                        paymentMode={row.payment_mode}
                        receiptNumber={row.receipt_number}
                        remarks={row.remarks}
                      />
                    </td>
                  </tr>
                ) : null}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
