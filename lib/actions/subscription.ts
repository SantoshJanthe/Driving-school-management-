"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireProfile } from "@/lib/auth/guards";
import { isPlatformOwner, paymentConfig, paymentReady } from "@/lib/subscription/config";
import { newAccessToken } from "@/lib/subscription/requests";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SubscribeState = { error?: string };

const subscribeSchema = z.object({
  school_name: z.string().trim().min(2, "Enter the school name").max(120, "School name is too long"),
  owner_name: z.string().trim().min(2, "Enter your name").max(120, "Name is too long"),
  phone: z
    .string()
    .transform((value) => {
      let digits = value.replace(/\D/g, "");
      if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
      if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
      return digits;
    })
    .refine((value) => /^[6-9][0-9]{9}$/.test(value), "Enter a 10-digit Indian mobile number"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .refine((value) => value === "" || z.string().email().safeParse(value).success, "Enter a valid email"),
  payment_method: z.enum(["upi", "bank"], { message: "Choose how you paid" }),
  payment_reference: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{6,40}$/, "Enter the UPI transaction ID or bank reference from your receipt"),
});

export async function submitSubscription(
  _prev: SubscribeState,
  formData: FormData,
): Promise<SubscribeState> {
  const config = paymentConfig();
  if (!paymentReady(config) || config.monthlyFee === null) {
    return { error: "Payment details are not set up yet." };
  }
  if (formData.get("paid") !== "on") {
    return { error: "Confirm that you have paid before sending the reference." };
  }
  const parsed = subscribeSchema.safeParse({
    school_name: formData.get("school_name") ?? "",
    owner_name: formData.get("owner_name") ?? "",
    phone: formData.get("phone") ?? "",
    email: formData.get("email") ?? "",
    payment_method: formData.get("payment_method") ?? "",
    payment_reference: formData.get("payment_reference") ?? "",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the details." };
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from("subscription_requests")
    .select("id", { count: "exact", head: true })
    .eq("phone", parsed.data.phone)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) {
    return { error: "This number already sent three payment references today. Wait for a reply." };
  }

  const { token, hash } = newAccessToken();
  const { error } = await admin.from("subscription_requests").insert({
    school_name: parsed.data.school_name,
    owner_name: parsed.data.owner_name,
    phone: parsed.data.phone,
    email: parsed.data.email || null,
    amount_inr: config.monthlyFee,
    payment_method: parsed.data.payment_method,
    payment_reference: parsed.data.payment_reference,
    access_token_hash: hash,
  });
  if (error) {
    if (error.code === "23505") {
      return { error: "This payment reference was already submitted." };
    }
    return { error: "Could not save the payment reference. Try again." };
  }

  redirect(`/subscribe/status?token=${token}`);
}

async function requireOwner() {
  const profile = await requireProfile();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !isPlatformOwner(user.email)) redirect("/dashboard?denied=vendor");
  return { profile, userId: user.id };
}

export async function verifySubscription(formData: FormData) {
  await reviewSubscription(formData, "verified");
}

export async function rejectSubscription(formData: FormData) {
  await reviewSubscription(formData, "rejected");
}

async function reviewSubscription(formData: FormData, decision: "verified" | "rejected") {
  const { userId } = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "").trim().slice(0, 300);
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;

  await createAdminClient()
    .from("subscription_requests")
    .update({
      status: decision,
      review_note: note || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("status", "pending");

  revalidatePath("/vendor/subscriptions");
}
