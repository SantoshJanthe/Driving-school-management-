"use client";

import { useActionState } from "react";

import { PasswordField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { resetPassword, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(resetPassword, initialState);

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <PasswordField
        label="New password"
        name="password"
        autoComplete="new-password"
        required
        autoFocus
        minLength={10}
        error={state.fieldErrors?.password}
        hint={
          <span className="text-xs text-muted-foreground">10+ characters, letters and digits</span>
        }
      />
      <PasswordField
        label="Confirm new password"
        name="confirm"
        autoComplete="new-password"
        required
        error={state.fieldErrors?.confirm}
      />

      <SubmitButton pendingText="Updating…">Set new password</SubmitButton>
    </form>
  );
}
