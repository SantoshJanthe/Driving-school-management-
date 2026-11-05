"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";

import { requirePermission } from "@/lib/auth/guards";
import { createRazorpayPaymentLink, razorpayStatus } from "@/lib/razorpay/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type PaymentLinkState = {
  error?: string;
  shortUrl?: string;
  linkId?: string;
  amountLabel?: string;
};

export type OfficePaymentState = { error?: string; ok?: boolean };

const PAYMENT_MODES = ["cash", "upi", "bank", "card"] as const;

export async function recordOfficePayment(
  _prev: OfficePaymentState,
  formData: FormData,
): Promise<OfficePaymentState> {
  const profile = await requirePermission("add_payment");
  const applicantId = String(formData.get("applicant_id") ?? "");
  const mode = String(formData.get("payment_mode") ?? "");
  const amountRaw = String(formData.get("amount") ?? "").trim();
  const paymentDate = String(formData.get("payment_date") ?? "").trim();
  const receipt = String(formData.get("receipt_number") ?? "").trim();
  const remarks = String(formData.get("remarks") ?? "").trim();

  if (!applicantId) return { error: "Choose an applicant." };
  if (!PAYMENT_MODES.includes(mode as (typeof PAYMENT_MODES)[number])) {
    return { error: "Choose cash, UPI, bank, or card." };
  }
  if (!/^\d+(\.\d{1,2})?$/.test(amountRaw)) return { error: "Enter an amount of at least ₹1." };
  const amount = Number(amountRaw);
  if (!Number.isFinite(amount) || amount < 1 || amount > 999999.99) {
    return { error: "Enter an amount of at least ₹1." };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(paymentDate)) return { error: "Choose a payment date." };
  if (remarks.length > 500) return { error: "Remarks must be 500 characters or fewer." };

  const supabase = await createClient();
  const { data: applicant, error: applicantError } = await supabase
    .from("applicants")
    .select("id, school_id")
    .eq("id", applicantId)
    .maybeSingle();
  if (applicantError || !applicant || applicant.school_id !== profile.school_id) {
    return { error: "That applicant is not in your school." };
  }

  const { error } = await supabase.from("payments").insert({
    school_id: applicant.school_id,
    applicant_id: applicant.id,
    amount,
    payment_date: paymentDate,
    payment_mode: mode as (typeof PAYMENT_MODES)[number],
    receipt_number: receipt || null,
    remarks: remarks || null,
    recorded_by: profile.id,
  });
  if (error) {
    if (error.code === "23505") return { error: "That receipt number is already used." };
    if (error.code === "42501" || /row-level security/i.test(error.message)) {
      return { error: "You don't have permission to record a payment." };
    }
    return { error: error.message };
  }

  revalidatePath("/payments");
  revalidatePath("/fees");
  revalidatePath("/reports");
  revalidatePath(`/applicants/${applicant.id}`);
  revalidatePath(`/applicants/${applicant.id}/payments`);
  revalidatePath("/dashboard");
  return { ok: true };
}

function rupeesToPaise(raw: string): number | null {
  const value = raw.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return null;
  const paise = Math.round(Number(value) * 100);
  if (!Number.isFinite(paise) || paise < 100 || paise > 99_999_999) return null;
  return paise;
}

async function publicOrigin() {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host");
  const proto =
    headerStore.get("x-forwarded-proto") ?? (host?.includes("localhost") ? "http" : "https");
  if (host) return `${proto}://${host}`;
  return env.appUrl;
}

export async function createPaymentLink(
  _prev: PaymentLinkState,
  formData: FormData,
): Promise<PaymentLinkState> {
  const profile = await requirePermission("add_payment");
  if (!razorpayStatus().configured) {
    return { error: "Not connected. No charge was created." };
  }
  const applicantId = String(formData.get("applicant_id") ?? "");
  const paise = rupeesToPaise(String(formData.get("amount") ?? ""));
  const description = String(formData.get("description") ?? "").trim() || "Driving school fee";

  if (!applicantId) return { error: "Choose an applicant." };
  if (paise === null) return { error: "Enter an amount of at least ₹1." };

  const supabase = await createClient();
  const { data: applicant, error } = await supabase
    .from("applicants")
    .select("id, full_name, phone, email, school_id")
    .eq("id", applicantId)
    .maybeSingle();
  if (error || !applicant) return { error: "That applicant is not in your school." };
  if (applicant.school_id !== profile.school_id)
    return { error: "That applicant is not in your school." };

  try {
    const origin = await publicOrigin();
    const link = await createRazorpayPaymentLink({
      amountPaise: paise,
      description: description.slice(0, 255),
      applicantId: applicant.id,
      schoolId: applicant.school_id,
      name: applicant.full_name,
      contact: applicant.phone,
      email: applicant.email,
      callbackUrl: `${origin}/payments?razorpay=returned`,
    });
    const rupees = link.amountPaise / 100;
    return {
      shortUrl: link.shortUrl,
      linkId: link.id,
      amountLabel: rupees.toLocaleString("en-IN", { style: "currency", currency: "INR" }),
    };
  } catch (cause) {
    return {
      error: cause instanceof Error ? cause.message : "Razorpay could not create the link.",
    };
  }
}
