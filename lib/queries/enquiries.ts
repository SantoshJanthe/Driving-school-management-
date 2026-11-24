import { createClient } from "@/lib/supabase/server";

export type OpenEnquiry = {
  id: string;
  full_name: string;
  phone: string;
  license_category: string | null;
  created_at: string;
};

/** Applicants still in the enquiry status, newest first. */
export async function getOpenEnquiries(limit = 5): Promise<{ total: number; rows: OpenEnquiry[] }> {
  const supabase = await createClient();
  const { data, count, error } = await supabase
    .from("applicants")
    .select("id, full_name, phone, license_category, created_at", { count: "exact" })
    .eq("application_status", "enquiry")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return { total: count ?? 0, rows: data ?? [] };
}
