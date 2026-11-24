import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

type AuthFailure = { message?: string; status?: number } | null | undefined;

function missingAdminApi(error: AuthFailure) {
  const message = error?.message ?? "";
  return (
    error?.status === 404 || message === "not_found" || message.includes("/auth/v1/admin/users")
  );
}

function loginError(error: AuthFailure, fallback: string) {
  const message = error?.message?.trim() ?? "";
  if (!message || missingAdminApi(error) || message.startsWith("/auth/")) {
    return fallback;
  }
  return message;
}

export async function provisionAuthUser(input: {
  email: string;
  password: string;
  userMetadata: {
    school_id: string;
    full_name: string;
    role: "admin" | "staff";
    phone: string | null;
  };
}): Promise<{ userId: string } | { error: string }> {
  const admin = createAdminClient();
  const created = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: input.userMetadata,
  });
  if (!created.error && created.data.user) {
    return { userId: created.data.user.id };
  }
  if (!missingAdminApi(created.error)) {
    return { error: loginError(created.error, "Could not create the admin login.") };
  }

  const { data, error } = await admin.rpc("provision_login", {
    p_email: input.email,
    p_password: input.password,
    p_user_metadata: input.userMetadata,
  });
  if (error || !data) {
    return { error: loginError(error, "Could not create the admin login.") };
  }
  return { userId: data };
}

export async function setAuthPassword(
  userId: string,
  password: string,
): Promise<{ error?: string }> {
  const admin = createAdminClient();
  const updated = await admin.auth.admin.updateUserById(userId, { password });
  if (!updated.error) return {};
  if (!missingAdminApi(updated.error)) {
    return { error: loginError(updated.error, "Could not update the password.") };
  }
  const { error } = await admin.rpc("set_login_password", {
    p_user: userId,
    p_password: password,
  });
  if (error) return { error: loginError(error, "Could not update the password.") };
  return {};
}

export async function deleteAuthUser(userId: string) {
  const admin = createAdminClient();
  const removed = await admin.auth.admin.deleteUser(userId);
  if (!removed.error || !missingAdminApi(removed.error)) return;
  await admin.rpc("delete_login", { p_user: userId });
}
