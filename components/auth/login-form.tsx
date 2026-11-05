"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormField, PasswordField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { login, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const [state, formAction] = useActionState(login, initialState);
  const error = state.error ?? initialError;

  return (
    <form action={formAction} className="grid gap-4" noValidate>
      {next ? <input type="hidden" name="next" value={next} /> : null}

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
      <PasswordField
        label="Password"
        name="password"
        autoComplete="current-password"
        placeholder="••••••••••••"
        required
        error={state.fieldErrors?.password}
      />

      <SubmitButton pendingText="Signing in…">Sign in</SubmitButton>

      <Link
        href="/forgot-password"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Forgot password?
      </Link>
    </form>
  );
}
