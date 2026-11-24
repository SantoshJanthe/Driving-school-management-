"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { submitSubscription, type SubscribeState } from "@/lib/actions/subscription";

const initial: SubscribeState = {};

export function SubscribeForm({ hasUpi, hasBank }: { hasUpi: boolean; hasBank: boolean }) {
  const [state, action] = useActionState(submitSubscription, initial);

  return (
    <form action={action} className="grid gap-4">
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="subscribe-school">School name</Label>
          <Input id="subscribe-school" name="school_name" required className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subscribe-owner">Your name</Label>
          <Input id="subscribe-owner" name="owner_name" required autoComplete="name" className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subscribe-phone">Mobile</Label>
          <Input
            id="subscribe-phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            className="h-11"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subscribe-email">Email</Label>
          <Input id="subscribe-email" name="email" type="email" autoComplete="email" className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subscribe-method">Paid by</Label>
          <select
            id="subscribe-method"
            name="payment_method"
            required
            defaultValue={hasUpi ? "upi" : "bank"}
            className="h-11 w-full rounded-lg border border-input bg-background px-2.5 text-base md:text-sm"
          >
            {hasUpi ? <option value="upi">UPI</option> : null}
            {hasBank ? <option value="bank">Bank transfer</option> : null}
          </select>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="subscribe-reference">Transaction ID or UTR</Label>
          <Input
            id="subscribe-reference"
            name="payment_reference"
            required
            autoCapitalize="characters"
            className="h-11 font-mono"
          />
        </div>
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="paid" required className="mt-1 size-4" />
        <span>
          I have paid this month’s fee. The vendor may keep these details to check the payment and
          contact me about the subscription.
        </span>
      </label>
      <SubmitButton pendingText="Sending…" className="md:w-fit">
        Send payment for verification
      </SubmitButton>
    </form>
  );
}
