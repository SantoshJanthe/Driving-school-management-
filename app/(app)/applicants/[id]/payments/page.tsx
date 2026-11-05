import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { OfficePaymentForm } from "@/components/payments/office-payment-form";
import { requirePermission } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { formatDate, formatINR } from "@/lib/format";
import { getApplicant } from "@/lib/queries/applicants";
import { createClient } from "@/lib/supabase/server";
import { kolkataDate } from "@/lib/training/constants";

export const metadata: Metadata = { title: "Payments" };

function num(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

export default async function ApplicantPaymentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const profile = await requirePermission("view_applicants");
  const { id } = await params;
  if (!can(profile, "add_payment") && !can(profile, "view_financials")) {
    redirect(`/applicants/${id}`);
  }
  const applicant = await getApplicant(id);
  if (!applicant) notFound();

  const supabase = await createClient();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, payment_date, payment_mode, receipt_number, remarks")
    .eq("applicant_id", id)
    .order("payment_date", { ascending: false });

  return (
    <div className="grid gap-5">
      <dl className="grid gap-3 sm:grid-cols-3">
        {[
          ["Total fee", formatINR(applicant.total_fee)],
          ["Paid", formatINR(applicant.amount_paid)],
          ["Balance", formatINR(applicant.balance_due)],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border bg-[#fffcf7] p-4">
            <dt className="text-xs tracking-wide text-muted-foreground uppercase">{label}</dt>
            <dd className="mt-1 text-2xl font-medium">{value}</dd>
          </div>
        ))}
      </dl>
      {can(profile, "add_payment") ? (
        <OfficePaymentForm
          applicants={[
            {
              id: applicant.id,
              full_name: applicant.full_name,
              phone: applicant.phone,
              application_number: applicant.application_number,
              balance_due: applicant.balance_due,
            },
          ]}
          selectedId={applicant.id}
          paymentDate={kolkataDate()}
        />
      ) : null}
      <section className="grid gap-2">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Payments</h2>
        {(payments ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">No payments yet.</p>
        ) : (
          <ul className="grid gap-2">
            {(payments ?? []).map((row) => (
              <li key={row.id} className="rounded-xl border px-4 py-3 text-sm">
                <p className="font-medium">
                  {formatDate(row.payment_date)} · {row.payment_mode} · {formatINR(num(row.amount))}
                </p>
                <p className="text-muted-foreground">
                  {row.receipt_number ? `Receipt ${row.receipt_number}` : "No receipt number"}
                  {row.remarks ? ` · ${row.remarks}` : ""}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
