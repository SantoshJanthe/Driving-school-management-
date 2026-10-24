import { createAdminClient } from "@/lib/supabase/admin";
import type { Enums } from "@/lib/database.types";
import { verifyRazorpayWebhook } from "@/lib/razorpay/server";

export const runtime = "nodejs";

type PaymentMode = Enums<"payment_mode">;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function notesOf(entity: Record<string, unknown> | null): Record<string, string> {
  const notes = asRecord(entity?.notes);
  if (!notes) return {};
  return Object.fromEntries(
    Object.entries(notes).map(([key, value]) => [key, typeof value === "string" ? value : ""]),
  );
}

function modeFrom(method: unknown): PaymentMode {
  if (method === "card") return "card";
  if (method === "netbanking") return "bank";
  return "upi";
}

/**
 * Razorpay calls this after a payment link is paid. The signature is checked
 * with RAZORPAY_WEBHOOK_SECRET before any row is written. The service role is
 * used because the caller is Razorpay, not a signed-in staff member.
 */
export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get("x-razorpay-signature");
  if (!verifyRazorpayWebhook(raw, signature)) {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = asRecord(JSON.parse(raw) as unknown);
  const name = typeof event?.event === "string" ? event.event : "";
  if (name !== "payment_link.paid" && name !== "payment.captured") {
    return Response.json({ ok: true, ignored: name });
  }

  const payload = asRecord(event?.payload);
  const payment = asRecord(asRecord(payload?.payment)?.entity);
  const link = asRecord(asRecord(payload?.payment_link)?.entity);
  const notes = { ...notesOf(payment), ...notesOf(link) };
  const applicantId = notes.applicant_id;
  const schoolId = notes.school_id;
  const paymentId = typeof payment?.id === "string" ? payment.id : "";
  const amountPaise = typeof payment?.amount === "number" ? payment.amount : 0;

  if (!applicantId || !schoolId || !paymentId || amountPaise <= 0) {
    return Response.json({ ok: true, ignored: "missing notes" });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("payments").insert({
    applicant_id: applicantId,
    school_id: schoolId,
    amount: amountPaise / 100,
    payment_mode: modeFrom(payment?.method),
    receipt_number: paymentId,
    remarks: link?.id ? `Razorpay ${String(link.id)}` : "Razorpay",
  });

  if (error && error.code !== "23505") {
    return Response.json({ error: "Could not record the payment" }, { status: 500 });
  }
  return Response.json({ ok: true });
}
