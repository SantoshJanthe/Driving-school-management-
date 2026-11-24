"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setSchoolAdminPassword, type SchoolAdminPasswordState } from "@/lib/actions/schools";

const initial: SchoolAdminPasswordState = {};

export function SchoolAdminPasswordForm({
  userId,
  schoolId,
  email,
}: {
  userId: string;
  schoolId: string;
  email: string;
}) {
  const [state, action] = useActionState(setSchoolAdminPassword, initial);

  return (
    <form action={action} className="grid gap-3 rounded-xl border border-black/10 bg-white/70 p-4">
      <p className="text-sm font-medium">Set password for {email}</p>
      <input type="hidden" name="user_id" value={userId} />
      <input type="hidden" name="school_id" value={schoolId} />
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.success ? (
        <Alert role="status">
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor={`password-${userId}`}>New password</Label>
          <Input
            id={`password-${userId}`}
            name="password"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="h-11"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor={`confirm-${userId}`}>Confirm password</Label>
          <Input
            id={`confirm-${userId}`}
            name="confirm"
            type="password"
            required
            minLength={10}
            autoComplete="new-password"
            className="h-11"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        At least 10 characters with a letter and a digit. The school admin uses this to sign in from
        now on.
      </p>
      <SubmitButton pendingText="Saving…" className="sm:w-fit">
        Save password
      </SubmitButton>
    </form>
  );
}
