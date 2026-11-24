"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { recordOfficePayment, type OfficePaymentState } from "@/lib/actions/payments";
import { formatINR } from "@/lib/format";
import type { PayableApplicant } from "@/lib/queries/payments";

const initial: OfficePaymentState = {};
const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function OfficePaymentForm({
  applicants,
  selectedId,
  paymentDate,
}: {
  applicants: PayableApplicant[];
  selectedId?: string;
  paymentDate: string;
}) {
  const [state, action] = useActionState(recordOfficePayment, initial);
  const selected = applicants.find((applicant) => applicant.id === selectedId) ?? applicants[0];

  return (
    <section className="grid gap-4 rounded-xl border p-4 md:p-5">
      <div className="grid gap-1">
        <h2 className="text-lg font-semibold">Record a payment</h2>
        <p className="text-sm text-muted-foreground">
          Cash, UPI, bank, or a card payment already taken at the office. This does not charge a card.
        </p>
      </div>
      <form action={action} className="grid gap-4">
        {state.error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        {state.ok ? (
          <Alert role="status">
            <AlertDescription>Payment recorded. The balance has been updated.</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor="office-applicant">Applicant</Label>
            <select
              id="office-applicant"
              name="applicant_id"
              className={selectClass}
              defaultValue={selected?.id ?? ""}
              required
            >
              <option value="" disabled>
                Choose an applicant
              </option>
              {applicants.map((applicant) => (
                <option key={applicant.id} value={applicant.id}>
                  {applicant.full_name}
                  {applicant.application_number ? ` · ${applicant.application_number}` : ""} · balance{" "}
                  {formatINR(applicant.balance_due)}
                </option>
              ))}
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="office-amount">Amount (₹)</Label>
            <Input
              id="office-amount"
              name="amount"
              inputMode="decimal"
              required
              defaultValue={selected && selected.balance_due > 0 ? String(selected.balance_due) : ""}
              className="h-11"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="office-mode">Mode</Label>
            <select id="office-mode" name="payment_mode" className={selectClass} defaultValue="cash" required>
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
              <option value="card">Card, already taken</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="office-date">Date</Label>
            <Input id="office-date" name="payment_date" type="date" required defaultValue={paymentDate} className="h-11" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="office-receipt">Receipt number</Label>
            <Input id="office-receipt" name="receipt_number" className="h-11" />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="office-remarks">Remarks</Label>
            <Textarea id="office-remarks" name="remarks" rows={2} maxLength={500} />
          </div>
        </div>
        <SubmitButton pendingText="Saving…" className="md:w-fit">
          Record payment
        </SubmitButton>
      </form>
    </section>
  );
}
