"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { temporaryPassword } from "@/lib/auth/temporary-password";
import { requireAdmin } from "@/lib/auth/guards";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type IssueLoginState = {
  error?: string;
  issued?: { email: string; password: string };
};

export async function issueStudentLogin(
  _prev: IssueLoginState,
  formData: FormData,
): Promise<IssueLoginState> {
  const adminProfile = await requireAdmin();
  const applicantId = String(formData.get("applicant_id") ?? "");
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { error: "Enter a valid email." };

  const supabase = await createClient();
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .select("id, full_name, phone, school_id")
    .eq("id", applicantId)
    .maybeSingle();
  if (applicantError || !applicant || applicant.school_id !== adminProfile.school_id) {
    return { error: "That applicant is not in your school." };
  }

  const { data: existing } = await supabase
    .from("student_accounts")
    .select("profile_id")
    .eq("applicant_id", applicant.id)
    .maybeSingle();
  if (existing) return { error: "This applicant already has a student login." };

  const password = temporaryPassword();
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      school_id: adminProfile.school_id,
      full_name: applicant.full_name,
      role: "student",
      phone: applicant.phone,
    },
  });
  if (error || !data.user) {
    return { error: error?.message ?? "Could not create the login." };
  }

  const { error: linkError } = await supabase.from("student_accounts").insert({
    profile_id: data.user.id,
    school_id: adminProfile.school_id,
    applicant_id: applicant.id,
  });
  if (linkError) {
    await admin.auth.admin.deleteUser(data.user.id);
    return { error: "Could not link the login to this applicant." };
  }

  revalidatePath(`/applicants/${applicant.id}`);
  return { issued: { email, password } };
}

export async function unlinkStudentLogin(formData: FormData) {
  const adminProfile = await requireAdmin();
  const applicantId = String(formData.get("applicant_id") ?? "");
  const supabase = await createClient();
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, school_id")
    .eq("id", applicantId)
    .maybeSingle();
  if (!applicant || applicant.school_id !== adminProfile.school_id) {
    redirect(`/applicants/${applicantId}`);
  }

  const { data: link } = await supabase
    .from("student_accounts")
    .select("profile_id")
    .eq("applicant_id", applicant.id)
    .maybeSingle();
  if (!link) redirect(`/applicants/${applicant.id}?notice=unlinked`);

  const { error } = await supabase.from("student_accounts").delete().eq("applicant_id", applicant.id);
  if (error) redirect(`/applicants/${applicant.id}`);

  try {
    const admin = createAdminClient();
    const removed = await admin.auth.admin.deleteUser(link.profile_id);
    if (removed.error) {
      await supabase.from("profiles").update({ is_active: false }).eq("id", link.profile_id);
    }
  } catch {
    await supabase.from("profiles").update({ is_active: false }).eq("id", link.profile_id);
  }

  revalidatePath(`/applicants/${applicant.id}`);
  redirect(`/applicants/${applicant.id}?notice=unlinked`);
}
