"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormField, PasswordField } from "@/components/auth/form-field";
import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { login, signInWithGoogle, type AuthFormState } from "@/lib/actions/auth";

const initialState: AuthFormState = {};

export function LoginForm({
  next,
  initialError,
  google = false,
}: {
  next?: string;
  initialError?: string;
  google?: boolean;
}) {
  const [state, formAction] = useActionState(login, initialState);
  const [googleState, googleAction] = useActionState(signInWithGoogle, initialState);
  const error = state.error ?? googleState.error ?? initialError;

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

      {google ? (
        <>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" />
            or
            <span className="h-px flex-1 bg-border" />
          </div>
          <SubmitButton
            formAction={googleAction}
            variant="outline"
            pendingText="Opening Google…"
          >
            Continue with Google
          </SubmitButton>
          <p className="text-center text-xs text-muted-foreground">
            Use the Google address your school registered. Google cannot create a new account.
          </p>
        </>
      ) : null}

      <Link
        href="/forgot-password"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Forgot password?
      </Link>
    </form>
  );
}
