"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { startRazorpaySubscription, type SubscribeState } from "@/lib/actions/subscription";

const initial: SubscribeState = {};

export function RazorpaySubscribeForm({ amountLabel }: { amountLabel: string }) {
  const [state, action] = useActionState(startRazorpaySubscription, initial);

  return (
    <form action={action} className="grid gap-4">
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="rzp-school">School name</Label>
          <Input id="rzp-school" name="school_name" required className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rzp-owner">Your name</Label>
          <Input id="rzp-owner" name="owner_name" required autoComplete="name" className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rzp-phone">Mobile</Label>
          <Input id="rzp-phone" name="phone" required inputMode="tel" autoComplete="tel" className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="rzp-email">Email</Label>
          <Input id="rzp-email" name="email" type="email" autoComplete="email" className="h-11" />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        You pay on Razorpay’s page by card, UPI, or netbanking. The download opens as soon as Razorpay
        confirms the payment.
      </p>
      <SubmitButton pendingText="Opening Razorpay…" className="md:w-fit">
        Pay {amountLabel} with Razorpay
      </SubmitButton>
    </form>
  );
}
