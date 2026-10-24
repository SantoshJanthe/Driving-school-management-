"use server";

import { headers } from "next/headers";

import { requirePermission } from "@/lib/auth/guards";
import { createRazorpayPaymentLink } from "@/lib/razorpay/server";
import { createClient } from "@/lib/supabase/server";
import { env } from "@/lib/env";

export type PaymentLinkState = {
  error?: string;
  shortUrl?: string;
  linkId?: string;
  amountLabel?: string;
};

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
