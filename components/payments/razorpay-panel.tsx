"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPaymentLink, type PaymentLinkState } from "@/lib/actions/payments";
import { formatINR } from "@/lib/format";
import type { PayableApplicant } from "@/lib/queries/payments";

type RazorpayStatus = {
  configured: boolean;
  mode: "test" | "live" | "unset";
  keyHint: string | null;
  webhookConfigured: boolean;
};

const selectClass =
  "border-input bg-background h-11 w-full rounded-lg border px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

const initial: PaymentLinkState = {};

export function RazorpayPanel({
  status,
  applicants,
  selectedId,
  webhookUrl,
  canCreate,
}: {
  status: RazorpayStatus;
  applicants: PayableApplicant[];
  selectedId?: string;
  webhookUrl: string;
  canCreate: boolean;
}) {
  const [state, action] = useActionState(createPaymentLink, initial);
  const selected = applicants.find((applicant) => applicant.id === selectedId) ?? applicants[0];

  return (
    <section className="grid gap-4 rounded-xl border p-4 md:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">Razorpay</h2>
          <p className="text-sm text-muted-foreground">
            Payment Links API · <span className="font-mono">api.razorpay.com/v1/payment_links</span>
          </p>
        </div>
        <Badge variant={status.configured ? "default" : "outline"}>
          {status.mode === "live" ? "Live" : status.mode === "test" ? "Test mode" : "Not connected"}
        </Badge>
      </div>

      <dl className="grid gap-2 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Key</dt>
          <dd className="font-mono">{status.keyHint ?? "RAZORPAY_KEY_ID is not set"}</dd>
        </div>
        <div>
          <dt className="text-xs tracking-wide text-muted-foreground uppercase">Webhook</dt>
          <dd className="font-mono text-xs break-all">{webhookUrl}</dd>
        </div>
      </dl>

      {!status.configured ? (
        <Alert>
          <AlertDescription>
            Add <span className="font-mono">RAZORPAY_KEY_ID</span> and{" "}
            <span className="font-mono">RAZORPAY_KEY_SECRET</span> from the Razorpay dashboard (test
            keys start with <span className="font-mono">rzp_test_</span>) to{" "}
            <span className="font-mono">.env.local</span>, then restart the app. The secret stays on
            the server. Payers finish checkout on Razorpay.
          </AlertDescription>
        </Alert>
      ) : null}

      {canCreate ? (
        <form action={action} className="grid gap-4">
          {state.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          {state.shortUrl ? (
            <Alert role="status">
              <AlertDescription>
                Razorpay link for {state.amountLabel}:{" "}
                <a
                  href={state.shortUrl}
                  className="font-medium underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {state.shortUrl}
                </a>
                {state.linkId ? (
                  <span className="text-muted-foreground"> · {state.linkId}</span>
                ) : null}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-1.5">
              <Label htmlFor="applicant_id">Applicant</Label>
              <select
                id="applicant_id"
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
                    {applicant.application_number ? ` · ${applicant.application_number}` : ""} ·
                    balance {formatINR(applicant.balance_due)}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                name="amount"
                inputMode="decimal"
                required
                defaultValue={
                  selected && selected.balance_due > 0 ? String(selected.balance_due) : ""
                }
                placeholder="500"
                className="h-11 text-base md:text-sm"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              name="description"
              defaultValue="Driving school fee"
              className="h-11 text-base md:text-sm"
            />
          </div>
          <SubmitButton pendingText="Contacting Razorpay…" className="md:w-fit">
            Create Razorpay link
          </SubmitButton>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          You can view payments. Creating a Razorpay link needs the add-payment permission.
        </p>
      )}
    </section>
  );
}
