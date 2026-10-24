"use server";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { DEACTIVATED_MESSAGE, NO_PROFILE_MESSAGE } from "@/lib/auth/messages";
import { env } from "@/lib/env";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  safeNextPath,
} from "@/lib/validation/auth";

export type AuthFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  success?: string;
};

function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export async function login(_prev: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    if (error.code === "over_request_rate_limit" || error.status === 429) {
      return { error: "Too many attempts. Please wait a few minutes and try again." };
    }
    return { error: "Incorrect email or password" };
  }

  // Deactivated users can still authenticate with Supabase Auth until the admin
  // ban propagates; the profile flag is the source of truth, so check it here.
  const { data: profile } = await supabase.rpc("current_profile");
  if (!profile || !profile.id) {
    await supabase.auth.signOut();
    return { error: NO_PROFILE_MESSAGE };
  }
  if (!profile.is_active) {
    await supabase.auth.signOut();
    return { error: DEACTIVATED_MESSAGE };
  }

  // Best effort: the login row is useful for the activity log but must never
  // block sign-in.
  await supabase.rpc("log_event", { p_action: "login", p_entity_type: "auth" });

  redirect(safeNextPath(parsed.data.next));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function forgotPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const redirectTo = `${env.appUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`;
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo });

  if (error && (error.status === 429 || error.code === "over_email_send_rate_limit")) {
    return { error: "Too many reset requests. Please wait a few minutes and try again." };
  }

  // Same message whether or not the address exists, so the form cannot be used
  // to enumerate staff accounts.
  return {
    success:
      "If an account exists for that email, a password reset link has been sent. Check your inbox.",
  };
}

export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: "This reset link has expired. Request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    if (error.code === "same_password") {
      return { error: "New password must be different from the current one." };
    }
    if (error.code === "weak_password") {
      return { error: "Password is too weak. Use at least 10 characters with letters and digits." };
    }
    return { error: error.message };
  }

  redirect("/dashboard?password=updated");
}
