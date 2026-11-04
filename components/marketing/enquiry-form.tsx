"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitEnquiry, type EnquiryState } from "@/lib/actions/enquiry";
import { formatINR } from "@/lib/format";
import type { CoursePackage } from "@/lib/school/packages";

const initial: EnquiryState = {};

export function EnquiryForm({
  packages,
  selected,
}: {
  packages: CoursePackage[];
  selected?: string;
}) {
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
        <Label htmlFor="enquiry-package">Course</Label>
        <select
          id="enquiry-package"
          name="package_code"
          required
          defaultValue={
            selected && packages.some((item) => item.code === selected)
              ? selected
              : packages[0]?.code
          }
          className="h-11 w-full rounded-lg border border-input bg-background px-2.5 text-base md:text-sm"
        >
          {packages.map((item) => (
            <option key={item.code} value={item.code}>
              {item.name} · {formatINR(item.fee)}
            </option>
          ))}
        </select>
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
      <SubmitButton pendingText="Sending…" className="md:w-fit">
        Send enquiry
      </SubmitButton>
    </form>
  );
}
