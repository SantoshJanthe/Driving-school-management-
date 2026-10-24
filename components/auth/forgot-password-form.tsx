"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { forgotPassword, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function ForgotPasswordForm({ initialError }: { initialError?: string }) {
  const [state, formAction] = useActionState(forgotPassword, initialState);
  const error = state.error ?? initialError;

  if (state.success) {
    return (
      <div className="grid gap-4">
        <Alert role="status">
          <AlertDescription>{state.success}</AlertDescription>
        </Alert>
        <Link href="/login" className="text-center text-sm underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      <FormField
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoComplete="username"
        autoCapitalize="none"
        placeholder="office@school.com"
        required
        autoFocus
        error={state.fieldErrors?.email}
      />

      <SubmitButton pendingText="Sending…">Send reset link</SubmitButton>

      <Link
        href="/login"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Back to sign in
      </Link>
    </form>
  );
}
