import "server-only";

import { createHash, randomBytes } from "node:crypto";

import { createAdminClient } from "@/lib/supabase/admin";

export type SubscriptionRequest = {
  id: string;
  school_name: string;
  owner_name: string;
  phone: string;
  email: string | null;
  amount_inr: number;
  payment_method: string;
  payment_reference: string;
  status: "pending" | "verified" | "rejected";
  review_note: string | null;
  reviewed_at: string | null;
  created_at: string;
};

const COLUMNS =
  "id, school_name, owner_name, phone, email, amount_inr, payment_method, payment_reference, status, review_note, reviewed_at, created_at";

export function newAccessToken() {
  const token = randomBytes(32).toString("base64url");
  return { token, hash: hashToken(token) };
}

export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

/** The request a buyer's link points to, or null for an unknown or malformed token. */
export async function requestForToken(token: string | undefined | null) {
  if (!token || !/^[A-Za-z0-9_-]{40,60}$/.test(token)) return null;
  const { data, error } = await createAdminClient()
    .from("subscription_requests")
    .select(COLUMNS)
    .eq("access_token_hash", hashToken(token))
    .maybeSingle();
  if (error || !data) return null;
  return data as SubscriptionRequest;
}

/**
 * Marks a Razorpay subscription paid once Razorpay confirms it, either through the
 * signed return link or the signed webhook. The amount must cover the fee on the request.
 */
export async function markRazorpayPaid(input: {
  requestId: string;
  linkId: string;
  paymentId: string;
  amountPaise: number | null;
}) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("subscription_requests")
    .select("id, amount_inr, payment_method, payment_reference, status")
    .eq("id", input.requestId)
    .maybeSingle();
  if (!data || data.payment_method !== "razorpay" || data.payment_reference !== input.linkId) {
    return false;
  }
  if (data.status === "verified") return true;
  if (input.amountPaise !== null && input.amountPaise < Math.round(Number(data.amount_inr) * 100)) {
    return false;
  }
  const { error } = await admin
    .from("subscription_requests")
    .update({
      status: "verified",
      review_note: `Paid on Razorpay (${input.paymentId})`.slice(0, 300),
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", input.requestId)
    .eq("status", "pending");
  return !error;
}

export async function listRequests() {
  const { data, error } = await createAdminClient()
    .from("subscription_requests")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data as SubscriptionRequest[];
}
