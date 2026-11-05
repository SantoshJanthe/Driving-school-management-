"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createSchoolWithAdmin, type SchoolSetupState } from "@/lib/actions/schools";

const initial: SchoolSetupState = {};

export function NewSchoolForm({ currentSchool }: { currentSchool: string }) {
  const [state, action] = useActionState(createSchoolWithAdmin, initial);

  if (state.issued) {
    return (
      <Alert role="status">
        <AlertDescription>
          <span className="block font-medium">
            {state.issued.schoolName} is a separate school. You are still signed in to{" "}
            {currentSchool}.
          </span>
          <span className="mt-2 block">
            Give the first admin these details now. The password is not shown again.
          </span>
          <span className="mt-2 block font-mono text-sm">
            {state.issued.email}
            <br />
            {state.issued.password}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={action} className="grid max-w-xl gap-4">
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="school-name">School name</Label>
        <Input id="school-name" name="school_name" required className="h-11" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="school-address">Address</Label>
        <Textarea id="school-address" name="address" rows={2} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="school-phone">Phone</Label>
          <Input id="school-phone" name="phone" autoComplete="tel" className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="school-email">School email</Label>
          <Input id="school-email" name="school_email" type="email" className="h-11" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="admin-name">First admin name</Label>
          <Input id="admin-name" name="admin_name" required className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="admin-email">First admin email</Label>
          <Input
            id="admin-email"
            name="admin_email"
            type="email"
            required
            autoComplete="off"
            className="h-11"
          />
        </div>
      </div>
      <SubmitButton pendingText="Creating…" className="sm:w-fit">
        Create school
      </SubmitButton>
    </form>
  );
}
