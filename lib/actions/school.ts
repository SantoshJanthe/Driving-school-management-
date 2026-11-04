"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/guards";
import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";
import { readSchoolForm, schoolSettingsSchema } from "@/lib/validation/school";

export type SchoolFormState = { error?: string; ok?: boolean };

export async function updateSchool(
  _prev: SchoolFormState,
  formData: FormData,
): Promise<SchoolFormState> {
  await requireAdmin();
  const parsed = schoolSettingsSchema.safeParse(readSchoolForm(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the school details." };
  }

  const supabase = await createClient();
  const { data: current, error: readError } = await supabase
    .from("schools")
    .select("id, settings")
    .limit(1)
    .maybeSingle();
  if (readError || !current) return { error: "Could not load the school." };

  const previous =
    current.settings && typeof current.settings === "object" && !Array.isArray(current.settings)
      ? current.settings
      : {};
  const settings = {
    ...previous,
    packages: parsed.data.packages,
  } as Json;

  const { error } = await supabase
    .from("schools")
    .update({
      name: parsed.data.name,
      address: parsed.data.address || null,
      contact_phone: parsed.data.contact_phone || null,
      email: parsed.data.email || null,
      settings,
    })
    .eq("id", current.id);
  if (error) {
    if (error.code === "42501" || /row-level security/i.test(error.message)) {
      return { error: "You don't have permission for this action." };
    }
    return { error: "Could not save the school details." };
  }

  revalidatePath("/");
  revalidatePath("/settings");
  revalidatePath("/applicants/new");
  return { ok: true };
}
