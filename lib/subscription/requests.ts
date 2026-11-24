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

export async function listRequests() {
  const { data, error } = await createAdminClient()
    .from("subscription_requests")
    .select(COLUMNS)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error || !data) return [];
  return data as SubscriptionRequest[];
}
