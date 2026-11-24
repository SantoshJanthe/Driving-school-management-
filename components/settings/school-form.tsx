"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSchool, type SchoolFormState } from "@/lib/actions/school";

const initial: SchoolFormState = {};

const MAX_LOGO_BYTES = 2_000_000;

export function SchoolForm({
  name,
  address,
  phone,
  email,
  hasLogo,
  logoVersion,
}: {
  name: string;
  address: string;
  phone: string;
  email: string;
  hasLogo: boolean;
  logoVersion: string;
}) {
  const [state, action] = useActionState(updateSchool, initial);
  const [clientError, setClientError] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const input = event.currentTarget.elements.namedItem("logo");
    const file = input instanceof HTMLInputElement ? input.files?.[0] : undefined;
    if (!file || file.size === 0) {
      setClientError(null);
      return;
    }
    const allowed =
      ["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
      (file.type === "" && /\.(png|jpe?g|webp)$/i.test(file.name));
    if (!allowed) {
      event.preventDefault();
      setClientError("Logo must be a PNG, JPEG, or WEBP.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      event.preventDefault();
      setClientError("Logo must be under 2 MB.");
      return;
    }
    setClientError(null);
  }

  return (
    <form action={action} onSubmit={onSubmit} className="grid gap-8">
      {clientError || state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{clientError ?? state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert role="status">
          <AlertDescription>
            School details saved. The public page uses this name, contact, and logo.
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
            {hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/branding/logo?v=${encodeURIComponent(logoVersion)}`}
                alt=""
                className="size-16 rounded-xl object-cover"
              />
            ) : (
              <p className="text-sm text-muted-foreground">No logo yet.</p>
            )}
            <Input id="school-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
            <p className="text-xs text-muted-foreground">PNG, JPEG, or WEBP. Under 2 MB.</p>
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
