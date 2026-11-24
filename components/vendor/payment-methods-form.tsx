"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { saveMethodChoice, type MethodsState } from "@/lib/actions/subscription";

const initial: MethodsState = {};

type Props = {
  razorpay: boolean;
  manual: boolean;
  razorpayConnected: boolean;
  manualReady: boolean;
  hasFee: boolean;
};

export function PaymentMethodsForm(props: Props) {
  const [state, action] = useActionState(saveMethodChoice, initial);

  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border border-black/10 bg-[#fffcf7] p-5"
      aria-labelledby="methods-heading"
    >
      <div className="grid gap-1">
        <h2 id="methods-heading" className="text-lg font-medium">
          Payment methods on the landing page
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose how schools pay the monthly fee. Switch on one or both.
        </p>
      </div>
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert role="status">
          <AlertDescription>Payment methods saved.</AlertDescription>
        </Alert>
      ) : null}

      <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/70 p-4">
        <input
          type="checkbox"
          name="razorpay"
          defaultChecked={props.razorpay}
          className="mt-1 size-4 accent-[#1a1916]"
        />
        <span className="grid gap-1">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            Razorpay
            <Badge variant={props.razorpayConnected ? "secondary" : "outline"}>
              {props.razorpayConnected ? "Connected" : "Not connected"}
            </Badge>
          </span>
          <span className="text-sm text-muted-foreground">
            Card, UPI, and netbanking on Razorpay’s page. The download opens automatically once
            Razorpay confirms the payment.
            {props.razorpayConnected
              ? null
              : " Add RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and RAZORPAY_WEBHOOK_SECRET on the server to take payments."}
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-xl border border-black/10 bg-white/70 p-4">
        <input
          type="checkbox"
          name="manual"
          defaultChecked={props.manual}
          className="mt-1 size-4 accent-[#1a1916]"
        />
        <span className="grid gap-1">
          <span className="flex flex-wrap items-center gap-2 font-medium">
            Manual UPI or bank transfer
            <Badge variant={props.manualReady ? "secondary" : "outline"}>
              {props.manualReady ? "Ready" : "Details missing"}
            </Badge>
          </span>
          <span className="text-sm text-muted-foreground">
            Schools pay your UPI ID or bank account and send the transaction ID. You verify each one
            below.
            {props.manualReady ? null : " Add PAYMENT_UPI_ID or PAYMENT_BANK_DETAILS on the server."}
          </span>
        </span>
      </label>

      {props.hasFee ? null : (
        <p className="text-sm text-muted-foreground">
          Set SUBSCRIPTION_MONTHLY_FEE on the server. The landing page shows no payment option until
          the fee is set.
        </p>
      )}

      <SubmitButton pendingText="Saving…" className="md:w-fit">
        Save payment methods
      </SubmitButton>
    </form>
  );
}
