import { requireAdmin } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

function cell(value: unknown) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

function num(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { data: students, error: studentError } = await supabase
    .from("applicants")
    .select("full_name, phone, email, license_category, total_fee, amount_paid, balance_due, application_status")
    .order("full_name");
  if (studentError) return new Response(studentError.message, { status: 500 });
  const { data: payments, error: paymentError } = await supabase
    .from("payments")
    .select("payment_date, amount, payment_mode, receipt_number, applicant:applicants(full_name)")
    .order("payment_date");
  if (paymentError) return new Response(paymentError.message, { status: 500 });

  const lines = [
    ["section", "name", "phone", "email", "course", "total_fee", "amount_paid", "balance", "status"].join(","),
    ...(students ?? []).map((row) =>
      [
        "student",
        row.full_name,
        row.phone,
        row.email,
        row.license_category,
        num(row.total_fee),
        num(row.amount_paid),
        num(row.balance_due),
        row.application_status,
      ]
        .map(cell)
        .join(","),
    ),
    "",
    ["section", "student", "date", "amount", "mode", "receipt"].join(","),
    ...(payments ?? []).map((row) => {
      const applicant = Array.isArray(row.applicant) ? row.applicant[0] : row.applicant;
      return ["payment", applicant?.full_name, row.payment_date, num(row.amount), row.payment_mode, row.receipt_number]
        .map(cell)
        .join(",");
    }),
  ];

  await supabase.from("audit_logs").insert({
    school_id: profile.school_id,
    user_id: profile.id,
    action: "data_exported",
    details: { tables: ["applicants", "payments"] },
  });

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="school-backup.csv"',
    },
  });
}
