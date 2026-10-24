"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin, requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import {
  applicantSchema,
  deleteApplicantSchema,
  fieldErrorsFrom,
  readApplicantForm,
  statusChangeSchema,
} from "@/lib/validation/applicants";

export type ApplicantFormState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

function permissionMessage(error: { code?: string; message: string }) {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "You don't have permission for this action.";
  }
  if (error.code === "23505") {
    return "An applicant with this application number already exists.";
  }
  return error.message;
}

async function staffInSchool(staffId: string | null) {
  if (!staffId) return true;
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id").eq("id", staffId).maybeSingle();
  return !!data;
}

export async function saveApplicant(
  _prev: ApplicantFormState,
  formData: FormData,
): Promise<ApplicantFormState> {
  const idRaw = formData.get("id");
  const id = typeof idRaw === "string" && idRaw.length > 0 ? idRaw : null;
  const profile = await requirePermission(id ? "edit_applicant" : "create_applicant");

  const parsed = applicantSchema.safeParse(readApplicantForm(formData));
  if (!parsed.success) {
    return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };
  }
  if (!(await staffInSchool(parsed.data.assigned_staff_id))) {
    return { fieldErrors: { assigned_staff_id: "That staff member is not in this school." } };
  }

  const supabase = await createClient();
  const row = {
    full_name: parsed.data.full_name,
    phone: parsed.data.phone,
    alternate_phone: parsed.data.alternate_phone,
    email: parsed.data.email,
    date_of_birth: parsed.data.date_of_birth,
    gender: parsed.data.gender as "male" | "female" | "other" | null,
    address: parsed.data.address,
    city: parsed.data.city,
    state: parsed.data.state,
    pincode: parsed.data.pincode,
    aadhaar_last4: parsed.data.aadhaar_last4,
    application_number: parsed.data.application_number,
    license_category: parsed.data.license_category,
    application_status: parsed.data.application_status,
    training_status: parsed.data.training_status,
    total_fee: parsed.data.total_fee,
    assigned_staff_id: parsed.data.assigned_staff_id,
    notes: parsed.data.notes,
  };

  if (id) {
    const { error } = await supabase.from("applicants").update(row).eq("id", id);
    if (error) return { error: permissionMessage(error) };
    revalidatePath("/applicants");
    revalidatePath(`/applicants/${id}`);
    redirect(`/applicants/${id}?notice=updated`);
  }

  const { data, error } = await supabase
    .from("applicants")
    .insert({ ...row, school_id: profile.school_id, created_by: profile.id })
    .select("id")
    .single();
  if (error || !data)
    return { error: error ? permissionMessage(error) : "Could not save the applicant." };
  revalidatePath("/applicants");
  revalidatePath("/dashboard");
  redirect(`/applicants/${data.id}?notice=created`);
}

export async function changeApplicantStatus(
  _prev: ApplicantFormState,
  formData: FormData,
): Promise<ApplicantFormState> {
  await requirePermission("edit_applicant");
  const parsed = statusChangeSchema.safeParse({
    id: formData.get("id"),
    application_status: formData.get("application_status"),
    training_status: formData.get("training_status"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("applicants")
    .update({
      application_status: parsed.data.application_status,
      training_status: parsed.data.training_status,
    })
    .eq("id", parsed.data.id);
  if (error) return { error: permissionMessage(error) };
  revalidatePath("/applicants");
  revalidatePath(`/applicants/${parsed.data.id}`);
  redirect(`/applicants/${parsed.data.id}?notice=status`);
}

export async function deleteApplicant(
  _prev: ApplicantFormState,
  formData: FormData,
): Promise<ApplicantFormState> {
  await requireAdmin();
  const parsed = deleteApplicantSchema.safeParse({
    id: formData.get("id"),
    confirm_name: formData.get("confirm_name"),
  });
  if (!parsed.success) return { fieldErrors: fieldErrorsFrom(parsed.error.issues) };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("applicants")
    .select("full_name")
    .eq("id", parsed.data.id)
    .maybeSingle();
  if (!existing) return { error: "This applicant no longer exists." };
  if (existing.full_name.trim().toLowerCase() !== parsed.data.confirm_name.trim().toLowerCase()) {
    return { fieldErrors: { confirm_name: "The name does not match." } };
  }

  const { error } = await supabase.from("applicants").delete().eq("id", parsed.data.id);
  if (error) return { error: permissionMessage(error) };
  revalidatePath("/applicants");
  revalidatePath("/dashboard");
  redirect("/applicants?notice=deleted");
}
