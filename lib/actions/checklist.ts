"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

export type ChecklistState = { error?: string; ok?: boolean };

const RESULTS = new Set(["", "pending", "pass", "fail"]);

export async function saveLicenceChecklist(
  _prev: ChecklistState,
  formData: FormData,
): Promise<ChecklistState> {
  await requirePermission("edit_applicant");
  const id = String(formData.get("id") ?? "");
  const llNumber = String(formData.get("ll_number") ?? "").trim();
  const llIssued = String(formData.get("ll_issued_on") ?? "").trim();
  const dlDate = String(formData.get("dl_test_date") ?? "").trim();
  const dlResult = String(formData.get("dl_result") ?? "");
  if (!RESULTS.has(dlResult)) return { error: "Choose a test result." };
  for (const value of [llIssued, dlDate]) {
    if (value && !/^\d{4}-\d{2}-\d{2}$/.test(value)) return { error: "Enter a valid date." };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("applicants")
    .update({
      ll_number: llNumber || null,
      ll_issued_on: llIssued || null,
      dl_test_date: dlDate || null,
      dl_result: dlResult || null,
    })
    .eq("id", id);
  if (error) return { error: "Could not save the checklist." };
  revalidatePath(`/applicants/${id}`);
  return { ok: true };
}
