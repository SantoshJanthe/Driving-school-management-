import { createClient } from "@/lib/supabase/server";

function monthStart() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
  }).format(new Date());
  return `${parts}-01`;
}

function num(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function getSchoolReport() {
  const start = monthStart();
  const supabase = await createClient();
  const [admissions, payments, balances, lessons] = await Promise.all([
    supabase
      .from("applicants")
      .select("id", { count: "exact", head: true })
      .gte("created_at", `${start}T00:00:00+05:30`),
    supabase.from("payments").select("amount").gte("payment_date", start),
    supabase.from("applicants").select("balance_due").gt("balance_due", 0),
    supabase
      .from("training_sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("session_date", start),
  ]);
  if (admissions.error) throw new Error(admissions.error.message);
  if (payments.error) throw new Error(payments.error.message);
  if (balances.error) throw new Error(balances.error.message);
  if (lessons.error) throw new Error(lessons.error.message);
  return {
    month: start,
    admissions: admissions.count ?? 0,
    collected: (payments.data ?? []).reduce((sum, row) => sum + num(row.amount), 0),
    pending: (balances.data ?? []).reduce((sum, row) => sum + num(row.balance_due), 0),
    lessons: lessons.count ?? 0,
  };
}
