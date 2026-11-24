"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitEnquiry, type EnquiryState } from "@/lib/actions/enquiry";

const initial: EnquiryState = {};

export function EnquiryForm({ schoolId }: { schoolId?: string }) {
  const [state, action] = useActionState(submitEnquiry, initial);

  if (state.ok) {
    return (
      <Alert role="status">
        <AlertDescription>
          Enquiry received. The school will call you on the number you entered. This is not a
          confirmed admission.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form id="enquire" action={action} className="grid gap-4">
      {schoolId ? <input type="hidden" name="school_id" value={schoolId} /> : null}
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="enquiry-name">Name</Label>
        <Input id="enquiry-name" name="full_name" required autoComplete="name" className="h-11" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="enquiry-phone">Mobile</Label>
          <Input
            id="enquiry-phone"
            name="phone"
            required
            inputMode="tel"
            autoComplete="tel"
            className="h-11"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="enquiry-email">Email</Label>
          <Input
            id="enquiry-email"
            name="email"
            type="email"
            autoComplete="email"
            className="h-11"
          />
        </div>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="enquiry-message">Message</Label>
        <Textarea
          id="enquiry-message"
          name="message"
          rows={3}
          maxLength={1000}
          placeholder="Preferred time of day, or a question"
        />
      </div>
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" name="consent" required className="mt-1 size-4" />
        <span>
          I agree that the school may keep my name, mobile number, and email so it can reply to
          this enquiry. The school does not use them for anything else.
        </span>
      </label>
      <SubmitButton pendingText="Sending…" className="md:w-fit">
        Send enquiry
      </SubmitButton>
    </form>
  );
}
