"use server";

import { createClient } from "@/lib/supabase/server";

export type EnquiryState = { error?: string; ok?: boolean };

export async function submitEnquiry(
  _prev: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const supabase = await createClient();
  const schoolId = String(formData.get("school_id") ?? "").trim();
  const { error } = await supabase.rpc("submit_enquiry", {
    p_full_name: String(formData.get("full_name") ?? ""),
    p_phone: String(formData.get("phone") ?? ""),
    p_email: String(formData.get("email") ?? ""),
    p_package_code: String(formData.get("package_code") ?? ""),
    p_message: String(formData.get("message") ?? ""),
    p_school: schoolId || null,
  });
  if (error) {
    const message = /10-digit|name|email|course|School/i.test(error.message)
      ? error.message.replace(/^.*ERROR:\s*/i, "")
      : "Could not send your enquiry. Please call the school.";
    return { error: message };
  }
  return { ok: true };
}
