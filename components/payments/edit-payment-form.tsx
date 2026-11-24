"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { editOfficePayment, type OfficePaymentState } from "@/lib/actions/payments";

const initial: OfficePaymentState = {};
const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function EditPaymentForm({
  id,
  amount,
  paymentDate,
  paymentMode,
  receiptNumber,
  remarks,
}: {
  id: string;
  amount: number;
  paymentDate: string;
  paymentMode: string;
  receiptNumber: string | null;
  remarks: string | null;
}) {
  const [state, action] = useActionState(editOfficePayment, initial);
  const date = paymentDate.slice(0, 10);

  return (
    <details className="mt-2">
      <summary className="cursor-pointer text-sm font-medium">Edit payment</summary>
      <form action={action} className="mt-3 grid gap-3">
        <input type="hidden" name="id" value={id} />
        {state.error ? (
          <Alert variant="destructive" role="alert">
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        {state.ok ? (
          <Alert role="status">
            <AlertDescription>Payment updated. The balance has been recalculated.</AlertDescription>
          </Alert>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-amount-${id}`}>Amount (₹)</Label>
            <Input
              id={`edit-amount-${id}`}
              name="amount"
              inputMode="decimal"
              required
              defaultValue={String(amount)}
              className="h-11"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-mode-${id}`}>Mode</Label>
            <select
              id={`edit-mode-${id}`}
              name="payment_mode"
              className={selectClass}
              defaultValue={paymentMode}
              required
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank</option>
              <option value="card">Card, already taken</option>
            </select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-date-${id}`}>Date</Label>
            <Input
              id={`edit-date-${id}`}
              name="payment_date"
              type="date"
              required
              defaultValue={date}
              className="h-11"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor={`edit-receipt-${id}`}>Receipt number</Label>
            <Input
              id={`edit-receipt-${id}`}
              name="receipt_number"
              defaultValue={receiptNumber ?? ""}
              className="h-11"
            />
          </div>
          <div className="grid gap-1.5 sm:col-span-2">
            <Label htmlFor={`edit-remarks-${id}`}>Remarks</Label>
            <Input
              id={`edit-remarks-${id}`}
              name="remarks"
              defaultValue={remarks ?? ""}
              maxLength={500}
              className="h-11"
            />
          </div>
        </div>
        <SubmitButton pendingText="Saving…" className="md:w-fit">
          Save payment
        </SubmitButton>
      </form>
    </details>
  );
}
