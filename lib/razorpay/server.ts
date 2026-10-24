import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

export type RazorpayMode = "test" | "live" | "unset";

export type RazorpayStatus = {
  configured: boolean;
  mode: RazorpayMode;
  /** First characters of the key id, safe to show. The secret is never included. */
  keyHint: string | null;
  webhookConfigured: boolean;
};

function keyId() {
  return process.env.RAZORPAY_KEY_ID?.trim() ?? "";
}

function keySecret() {
  return process.env.RAZORPAY_KEY_SECRET?.trim() ?? "";
}

/** Whether the server can call Razorpay. The secret never leaves this module. */
export function razorpayStatus(): RazorpayStatus {
  const id = keyId();
  const secret = keySecret();
  const configured = id.startsWith("rzp_") && secret.length >= 8;
  const mode: RazorpayMode = id.startsWith("rzp_live_")
    ? "live"
    : id.startsWith("rzp_test_")
      ? "test"
      : "unset";
  return {
    configured,
    mode,
    keyHint: configured ? `${id.slice(0, 14)}…` : null,
    webhookConfigured: (process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "").length >= 8,
  };
}

export type PaymentLinkResult = {
  id: string;
  shortUrl: string;
  amountPaise: number;
  status: string;
};

/**
 * Creates a Razorpay Payment Link. The payer completes checkout on Razorpay's
 * page, so card and UPI details never touch this app.
 */
export async function createRazorpayPaymentLink(input: {
  amountPaise: number;
  description: string;
  applicantId: string;
  schoolId: string;
  name: string;
  contact: string;
  email: string | null;
  callbackUrl: string;
}): Promise<PaymentLinkResult> {
  const id = keyId();
  const secret = keySecret();
  if (!id.startsWith("rzp_") || secret.length < 8) {
    throw new Error("Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.");
  }

  const response = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: "INR",
      accept_partial: false,
      description: input.description,
      reference_id: `${input.applicantId.slice(0, 8)}-${Date.now()}`,
      customer: {
        name: input.name,
        contact: input.contact,
        ...(input.email ? { email: input.email } : {}),
      },
      notify: { sms: false, email: false },
      reminder_enable: false,
      notes: {
        applicant_id: input.applicantId,
        school_id: input.schoolId,
      },
      callback_url: input.callbackUrl,
      callback_method: "get",
    }),
  });

  const body = (await response.json().catch(() => null)) as {
    id?: string;
    short_url?: string;
    amount?: number;
    status?: string;
    error?: { description?: string };
  } | null;

  if (!response.ok || !body?.id || !body.short_url) {
    throw new Error(body?.error?.description || "Razorpay could not create the payment link.");
  }

  return {
    id: body.id,
    shortUrl: body.short_url,
    amountPaise: body.amount ?? input.amountPaise,
    status: body.status ?? "created",
  };
}

export function verifyRazorpayWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim() ?? "";
  if (!secret || !signature) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
