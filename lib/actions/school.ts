"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

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

  const logo = await saveLogo(current.id, formData.get("logo"));
  if (logo.error) return { error: logo.error };

  const { error } = await supabase
    .from("schools")
    .update({
      name: parsed.data.name,
      address: parsed.data.address || null,
      contact_phone: parsed.data.contact_phone || null,
      email: parsed.data.email || null,
      settings,
      ...(logo.path ? { logo_path: logo.path } : {}),
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

function sniff(bytes: Buffer) {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) return "png";
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return "jpg";
  if (bytes.length >= 12 && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  return null;
}

async function saveLogo(schoolId: string, value: FormDataEntryValue | null) {
  if (!(value instanceof File) || value.size === 0) return { path: null as string | null };
  if (value.size > 2_000_000) return { error: "Logo must be under 2 MB." };
  const bytes = Buffer.from(await value.arrayBuffer());
  const ext = sniff(bytes);
  if (!ext) return { error: "Logo must be a PNG, JPEG, or WEBP." };
  const dir = path.join(process.cwd(), "var/school-logos");
  await mkdir(dir, { recursive: true });
  const relative = `var/school-logos/${schoolId}.${ext}`;
  await writeFile(path.join(process.cwd(), relative), bytes);
  return { path: relative };
}
