"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changeOwnPassword, type AuthFormState } from "@/lib/actions/auth";

const initial: AuthFormState = {};

export function PasswordForm() {
  const [state, action] = useActionState(changeOwnPassword, initial);

  return (
    <form action={action} className="grid max-w-md gap-4 rounded-2xl border border-black/10 bg-[#fffcf7] p-4 md:p-6">
      <h2 className="text-sm font-semibold tracking-wide uppercase">Password</h2>
      <p className="text-sm text-muted-foreground">
        Change the password for this login. It applies only to you.
      </p>
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
      {state.fieldErrors?.password ? (
        <p className="text-sm text-destructive">{state.fieldErrors.password}</p>
      ) : null}
      <div className="grid gap-1.5">
        <Label htmlFor="current-password">Current password</Label>
        <Input
          id="current-password"
          name="current"
          type="password"
          required
          autoComplete="current-password"
          className="h-11"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="new-password">New password</Label>
        <Input id="new-password" name="password" type="password" required autoComplete="new-password" className="h-11" />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="confirm-password">Confirm password</Label>
        <Input
          id="confirm-password"
          name="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="h-11"
        />
      </div>
      {state.fieldErrors?.confirm ? (
        <p className="text-sm text-destructive">{state.fieldErrors.confirm}</p>
      ) : null}
      <SubmitButton pendingText="Saving…" className="md:w-fit">
        Update password
      </SubmitButton>
    </form>
  );
}
