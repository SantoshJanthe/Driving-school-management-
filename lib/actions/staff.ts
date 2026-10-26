"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin } from "@/lib/auth/guards";
import {
  DEFAULT_STAFF_PERMISSIONS,
  PERMISSION_KEYS,
  type Permission,
  type Permissions,
  type Role,
} from "@/lib/auth/permissions";
import { env } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type StaffFormState = { error?: string };

function permissionMessage(error: { code?: string; message: string }) {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "You don't have permission for this action.";
  }
  return error.message;
}

function readPermissions(formData: FormData): Permissions {
  const permissions = { ...DEFAULT_STAFF_PERMISSIONS };
  for (const key of PERMISSION_KEYS) {
    permissions[key] = formData.get(`perm_${key}`) === "on";
  }
  return permissions;
}

function readRole(value: FormDataEntryValue | null): Role | null {
  return value === "admin" || value === "staff" ? value : null;
}

export async function inviteStaff(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const adminProfile = await requireAdmin();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = readRole(formData.get("role")) ?? "staff";
  const permissions = role === "admin" ? DEFAULT_STAFF_PERMISSIONS : readPermissions(formData);

  if (fullName.length < 2) return { error: "Enter the staff member's name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    data: {
      school_id: adminProfile.school_id,
      full_name: fullName,
      role,
      phone: phone || null,
      permissions,
    },
    redirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Could not send the invite." };
  }

  revalidatePath("/staff");
  redirect("/staff?notice=invited");
}

export async function updateStaff(
  _prev: StaffFormState,
  formData: FormData,
): Promise<StaffFormState> {
  const adminProfile = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = readRole(formData.get("role"));
  if (!id) return { error: "Missing staff member." };
  if (fullName.length < 2) return { error: "Enter a name." };
  if (!role) return { error: "Choose a role." };
  if (id === adminProfile.id && role !== "admin") {
    return { error: "You cannot change your own role." };
  }

  const permissions: Permissions =
    role === "admin" ? DEFAULT_STAFF_PERMISSIONS : readPermissions(formData);
  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, phone: phone || null, role, permissions })
    .eq("id", id);
  if (error) return { error: permissionMessage(error) };

  revalidatePath("/staff");
  revalidatePath(`/staff/${id}`);
  redirect(`/staff/${id}?notice=saved`);
}

export async function setStaffActive(formData: FormData) {
  const adminProfile = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) redirect("/staff");
  if (id === adminProfile.id) redirect(`/staff/${id}?notice=self`);

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ is_active: active }).eq("id", id);
  if (error) redirect(`/staff/${id}?notice=denied`);

  try {
    const admin = createAdminClient();
    const banned = await admin.auth.admin.updateUserById(id, {
      ban_duration: active ? "none" : "876000h",
    });
    if (banned.error) redirect(`/staff/${id}?notice=saved-profile-only`);
    if (!active) {
      const signedOut = await admin.auth.admin.signOut(id, "global");
      if (signedOut.error) redirect(`/staff/${id}?notice=saved-profile-only`);
    }
  } catch {
    redirect(`/staff/${id}?notice=saved-profile-only`);
  }

  revalidatePath("/staff");
  revalidatePath(`/staff/${id}`);
  redirect(`/staff/${id}?notice=${active ? "reactivated" : "deactivated"}`);
}

export async function resendInvite(formData: FormData) {
  const adminProfile = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const supabase = await createClient();
  const { data: member } = await supabase
    .from("profiles")
    .select("email, full_name, role, phone, permissions")
    .eq("id", id)
    .maybeSingle();
  if (!member) redirect("/staff");

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.inviteUserByEmail(member.email, {
    data: {
      school_id: adminProfile.school_id,
      full_name: member.full_name,
      role: member.role,
      phone: member.phone,
      permissions: member.permissions,
    },
    redirectTo: `${env.appUrl}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });
  redirect(`/staff/${id}?notice=${error ? "invite-failed" : "resent"}`);
}

export type { Permission };
