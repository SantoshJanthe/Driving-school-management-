import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type DashboardSummary = {
  total_applicants: number;
  active_trainees: number;
  applications_in_progress: number;
  applicants_with_balance: number;
  documents_this_month: number;
  /** Present only when the caller has `view_financials`. */
  total_balance_due?: number;
  collected_this_month?: number;
};

function num(value: Json | undefined): number {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

/** Calls the `dashboard_summary()` RPC; RLS + `has_permission` shape the result server-side. */
export async function getDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("dashboard_summary");
  if (error) throw new Error(`dashboard_summary failed: ${error.message}`);

  const raw = (data && typeof data === "object" && !Array.isArray(data) ? data : {}) as Record<
    string,
    Json | undefined
  >;

  const summary: DashboardSummary = {
    total_applicants: num(raw.total_applicants),
    active_trainees: num(raw.active_trainees),
    applications_in_progress: num(raw.applications_in_progress),
    applicants_with_balance: num(raw.applicants_with_balance),
    documents_this_month: num(raw.documents_this_month),
  };
  if ("total_balance_due" in raw) summary.total_balance_due = num(raw.total_balance_due);
  if ("collected_this_month" in raw) summary.collected_this_month = num(raw.collected_this_month);
  return summary;
}

export type TodaySession = {
  id: string;
  start_time: string | null;
  end_time: string | null;
  vehicle_type: string | null;
  status: "scheduled" | "completed" | "absent" | "cancelled";
  applicant: { id: string; full_name: string } | null;
  instructor: { full_name: string } | null;
};

/** Today's sessions (Asia/Kolkata) for the caller's school. */
export async function getTodaySessions(limit = 5): Promise<TodaySession[]> {
  const supabase = await createClient();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  const { data } = await supabase
    .from("training_sessions")
    .select(
      "id, start_time, end_time, vehicle_type, status, applicant:applicants(id, full_name), instructor:profiles!training_sessions_instructor_id_fkey(full_name)",
    )
    .eq("session_date", today)
    .order("start_time", { ascending: true, nullsFirst: false })
    .limit(limit);
  return (data ?? []) as unknown as TodaySession[];
}

export type RecentActivity = {
  id: number;
  action: string;
  entity_type: string;
  created_at: string;
  new_value: Json | null;
  user: { full_name: string } | null;
  applicant: { id: string; full_name: string } | null;
};

export async function getRecentActivity(limit = 6): Promise<RecentActivity[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_logs")
    .select(
      "id, action, entity_type, created_at, new_value, user:profiles!activity_logs_user_id_fkey(full_name), applicant:applicants(id, full_name)",
    )
    .neq("action", "login")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as unknown as RecentActivity[];
}
