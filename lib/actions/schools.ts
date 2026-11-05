"use server";

import { temporaryPassword } from "@/lib/auth/temporary-password";
import { requireAdmin } from "@/lib/auth/guards";
import { DEFAULT_PACKAGES } from "@/lib/school/packages";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

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

  const password = temporaryPassword();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: {
      school_id: schoolId,
      full_name: adminName,
      role: "admin",
      phone: phone || null,
    },
  });
  if (error || !data.user) {
    await supabase.rpc("delete_empty_school", { p_school: schoolId });
    return { error: error?.message ?? "Could not create the admin login." };
  }

  const { data: ready, error: readyError } = await supabase.rpc("school_has_admin", {
    p_school: schoolId,
    p_user: data.user.id,
  });
  if (readyError || !ready) {
    await admin.auth.admin.deleteUser(data.user.id);
    await supabase.rpc("delete_empty_school", { p_school: schoolId });
    return { error: "The admin profile was not created for that school." };
  }

  return { issued: { schoolName, email: adminEmail, password } };
}
