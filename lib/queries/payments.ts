import { createClient } from "@/lib/supabase/server";

export type PayableApplicant = {
  id: string;
  full_name: string;
  phone: string;
  application_number: string | null;
  balance_due: number;
};

export type LedgerRow = {
  id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  receipt_number: string | null;
  remarks: string | null;
  applicant_name: string | null;
  applicant_id: string | null;
};

function num(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function listPayableApplicants(): Promise<PayableApplicant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applicants")
    .select("id, full_name, phone, application_number, balance_due")
    .order("full_name")
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({ ...row, balance_due: num(row.balance_due) }));
}

export async function listRecentPayments(): Promise<LedgerRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payments")
    .select(
      "id, amount, payment_date, payment_mode, receipt_number, remarks, applicant:applicants(id, full_name)",
    )
    .order("payment_date", { ascending: false })
    .limit(25);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => {
    const applicant = Array.isArray(row.applicant) ? row.applicant[0] : row.applicant;
    return {
      id: row.id,
      amount: num(row.amount),
      payment_date: row.payment_date,
      payment_mode: row.payment_mode,
      receipt_number: row.receipt_number,
      remarks: row.remarks,
      applicant_name: applicant?.full_name ?? null,
      applicant_id: applicant?.id ?? null,
    };
  });
}
