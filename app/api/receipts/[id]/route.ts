import { requirePermission } from "@/lib/auth/guards";
import { formatDate, formatINR, formatPhone } from "@/lib/format";
import { getReceipt } from "@/lib/queries/fees";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  await requirePermission("view_financials");
  const { id } = await context.params;
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
