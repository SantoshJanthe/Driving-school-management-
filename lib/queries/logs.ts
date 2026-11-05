import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type ActivityLogRow = {
  id: number;
  action: string;
  entity_type: string;
  created_at: string;
  new_value: Json | null;
  user_name: string | null;
  applicant_name: string | null;
  applicant_id: string | null;
};

export type AuditLogRow = {
  id: number;
  action: string;
  created_at: string;
  details: Json | null;
  user_name: string | null;
  target_name: string | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** School-wide activity and audit rows. RLS already limits this to an admin. */
export async function getSchoolLogs(): Promise<{ activity: ActivityLogRow[]; audit: AuditLogRow[] }> {
  const supabase = await createClient();
  const [activity, audit] = await Promise.all([
    supabase
      .from("activity_logs")
      .select(
        "id, action, entity_type, created_at, new_value, user:profiles!activity_logs_user_id_fkey(full_name), applicant:applicants(id, full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(80),
    supabase
      .from("audit_logs")
      .select(
        "id, action, created_at, details, user:profiles!audit_logs_user_id_fkey(full_name), target:profiles!audit_logs_target_user_id_fkey(full_name)",
      )
      .order("created_at", { ascending: false })
      .limit(80),
  ]);
  if (activity.error) throw new Error(activity.error.message);
  if (audit.error) throw new Error(audit.error.message);

  return {
    activity: (activity.data ?? []).map((row) => {
      const user = one(row.user as { full_name: string } | { full_name: string }[] | null);
      const applicant = one(
        row.applicant as { id: string; full_name: string } | { id: string; full_name: string }[] | null,
      );
      return {
        id: row.id,
        action: row.action,
        entity_type: row.entity_type,
        created_at: row.created_at,
        new_value: row.new_value,
        user_name: user?.full_name ?? null,
        applicant_name: applicant?.full_name ?? null,
        applicant_id: applicant?.id ?? null,
      };
    }),
    audit: (audit.data ?? []).map((row) => {
      const user = one(row.user as { full_name: string } | { full_name: string }[] | null);
      const target = one(row.target as { full_name: string } | { full_name: string }[] | null);
      return {
        id: row.id,
        action: row.action,
        created_at: row.created_at,
        details: row.details,
        user_name: user?.full_name ?? null,
        target_name: target?.full_name ?? null,
      };
    }),
  };
}
