"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSchool, type SchoolFormState } from "@/lib/actions/school";

const initial: SchoolFormState = {};

export function SchoolForm({
  name,
  address,
  phone,
  email,
}: {
  name: string;
  address: string;
  phone: string;
  email: string;
}) {
  const [state, action] = useActionState(updateSchool, initial);

  return (
    <form action={action} className="grid gap-8">
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert role="status">
          <AlertDescription>
            School details saved. The public page uses this name and contact.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Branch</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="school-name">Display name</Label>
            <Input id="school-name" name="name" required defaultValue={name} className="h-11" />
            <p className="text-xs text-muted-foreground">
              Shown on the public page. The product title stays MOTOR DRIVING SCHOOL SOFTWARE.
            </p>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="school-address">Address</Label>
            <Textarea id="school-address" name="address" rows={3} defaultValue={address} />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="school-logo">Logo</Label>
            <Input id="school-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="school-phone">Phone</Label>
            <Input
              id="school-phone"
              name="contact_phone"
              defaultValue={phone}
              autoComplete="tel"
              className="h-11"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="school-email">Email</Label>
            <Input
              id="school-email"
              name="email"
              type="email"
              defaultValue={email}
              autoComplete="email"
              className="h-11"
            />
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save school details</SubmitButton>
      </div>
    </form>
  );
}
