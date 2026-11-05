import { requireProfile } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { formatDate, formatINR, formatPhone } from "@/lib/format";
import { getReceipt } from "@/lib/queries/fees";
import { createClient } from "@/lib/supabase/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const profile = await requireProfile();
  const { id } = await context.params;
  if (profile.role === "student") {
    const supabase = await createClient();
    const { data: link } = await supabase
      .from("student_accounts")
      .select("applicant_id")
      .eq("applicant_id", id)
      .maybeSingle();
    if (!link) return new Response("Not found", { status: 404 });
  } else if (!can(profile, "view_financials")) {
    return new Response("Not found", { status: 404 });
  }
  const receipt = await getReceipt(id);
  if (!receipt) return new Response("Not found", { status: 404 });
  const { applicant, school, payments } = receipt;
  const lines = [
    school?.name ?? "School",
    school?.address ?? "",
    school?.contact_phone ? formatPhone(school.contact_phone) : "",
    "",
    `Student: ${applicant.full_name}`,
    `Phone: ${formatPhone(applicant.phone)}`,
    `Course: ${applicant.license_category ?? ""}`,
    "",
    ...payments.map(
      (payment) =>
        `${formatDate(payment.payment_date)}  ${payment.payment_mode}  ${payment.receipt_number ?? ""}  ${formatINR(payment.amount)}`,
    ),
    "",
    `Total fee: ${formatINR(applicant.total_fee)}`,
    `Paid: ${formatINR(applicant.amount_paid)}`,
    `Balance: ${formatINR(applicant.balance_due)}`,
  ];
  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="receipt-${applicant.full_name.replace(/[^\w.-]+/g, "_")}.txt"`,
    },
  });
}
