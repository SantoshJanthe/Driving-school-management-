import { createClient } from "@/lib/supabase/server";

export type BalanceRow = {
  id: string;
  full_name: string;
  phone: string;
  license_category: string | null;
  total_fee: number;
  amount_paid: number;
  balance_due: number;
};

export type ReceiptPayment = {
  id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  receipt_number: string | null;
};

function num(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function listOutstandingBalances(): Promise<BalanceRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applicants")
    .select("id, full_name, phone, license_category, total_fee, amount_paid, balance_due")
    .gt("balance_due", 0)
    .order("balance_due", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    total_fee: num(row.total_fee),
    amount_paid: num(row.amount_paid),
    balance_due: num(row.balance_due),
  }));
}

export async function getReceipt(applicantId: string) {
  const supabase = await createClient();
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, full_name, phone, license_category, total_fee, amount_paid, balance_due, school_id")
    .eq("id", applicantId)
    .maybeSingle();
  if (!applicant) return null;
  const { data: school } = await supabase
    .from("schools")
    .select("name, contact_phone, address")
    .eq("id", applicant.school_id)
    .maybeSingle();
  const { data: payments } = await supabase
    .from("payments")
    .select("id, amount, payment_date, payment_mode, receipt_number")
    .eq("applicant_id", applicantId)
    .order("payment_date", { ascending: true });
  return {
    school,
    applicant: {
      ...applicant,
      total_fee: num(applicant.total_fee),
      amount_paid: num(applicant.amount_paid),
      balance_due: num(applicant.balance_due),
    },
    payments: (payments ?? []).map((row) => ({ ...row, amount: num(row.amount) })),
  };
}
