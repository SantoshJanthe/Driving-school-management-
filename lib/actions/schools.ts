"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin, requirePlatformOwner } from "@/lib/auth/guards";
import { deleteAuthUser, provisionAuthUser, setAuthPassword } from "@/lib/auth/provision-user";
import { DEFAULT_PACKAGES } from "@/lib/school/packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { resetPasswordSchema } from "@/lib/validation/auth";

export type SchoolSetupState = {
  error?: string;
  issued?: { schoolName: string; email: string; password: string };
};

export async function createSchoolWithAdmin(
  _prev: SchoolSetupState,
  formData: FormData,
): Promise<SchoolSetupState> {
  await requireAdmin();
  const schoolName = String(formData.get("school_name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const schoolEmail = String(formData.get("school_email") ?? "")
    .trim()
    .toLowerCase();
  const adminName = String(formData.get("admin_name") ?? "").trim();
  const adminEmail = String(formData.get("admin_email") ?? "")
    .trim()
    .toLowerCase();

  if (schoolName.length < 2) return { error: "Enter the school name." };
  if (adminName.length < 2) return { error: "Enter the admin's name." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) return { error: "Enter the admin's email." };
  if (schoolEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(schoolEmail)) {
    return { error: "Enter a valid school email." };
  }
  const passwordParsed = resetPasswordSchema.safeParse({
    password: formData.get("admin_password") ?? "",
    confirm: formData.get("admin_password_confirm") ?? "",
  });
  if (!passwordParsed.success) {
    return { error: passwordParsed.error.issues[0]?.message ?? "Check the admin password." };
  }
  const password = passwordParsed.data.password;

  const supabase = await createClient();
  const { data: schoolId, error: schoolError } = await supabase.rpc("create_school", {
    p_name: schoolName,
    p_address: address,
    p_phone: phone,
    p_email: schoolEmail,
    p_settings: {
      receipt_prefix: "R-",
      default_sessions: 12,
      packages: DEFAULT_PACKAGES,
    },
  });
  if (schoolError || !schoolId) {
    return { error: schoolError?.message ?? "Could not create the school." };
  }

  const provisioned = await provisionAuthUser({
    email: adminEmail,
    password,
    userMetadata: {
      school_id: schoolId,
      full_name: adminName,
      role: "admin",
      phone: phone || null,
    },
  });
  if ("error" in provisioned) {
    await supabase.rpc("delete_empty_school", { p_school: schoolId });
    return { error: provisioned.error };
  }

  const { data: ready, error: readyError } = await supabase.rpc("school_has_admin", {
    p_school: schoolId,
    p_user: provisioned.userId,
  });
  if (readyError || !ready) {
    await deleteAuthUser(provisioned.userId);
    await supabase.rpc("delete_empty_school", { p_school: schoolId });
    return { error: "The admin profile was not created for that school." };
  }

  return { issued: { schoolName, email: adminEmail, password } };
}

export type SchoolAdminPasswordState = { error?: string; success?: string };

export async function setSchoolAdminPassword(
  _prev: SchoolAdminPasswordState,
  formData: FormData,
): Promise<SchoolAdminPasswordState> {
  await requirePlatformOwner();
  const userId = String(formData.get("user_id") ?? "");
  const schoolId = String(formData.get("school_id") ?? "");
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password") ?? "",
    confirm: formData.get("confirm") ?? "",
  });
  if (!userId || !schoolId) return { error: "Choose a school admin." };
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the password." };
  }

  const admin = createAdminClient();
  const { data: member } = await admin
    .from("profiles")
    .select("id, full_name, email, role, school_id")
    .eq("id", userId)
    .eq("school_id", schoolId)
    .maybeSingle();
  if (!member || member.role !== "admin") {
    return { error: "That login is not a school admin." };
  }

  const updated = await setAuthPassword(member.id, parsed.data.password);
  if (updated.error) return { error: updated.error };

  revalidatePath("/vendor/schools");
  return { success: `Password updated for ${member.email}.` };
}
