"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAdmin, requirePermission } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { isSessionStatus, VEHICLE_TYPES } from "@/lib/training/constants";

export type SessionFormState = { error?: string };

function permissionMessage(error: { code?: string; message: string }) {
  if (error.code === "42501" || /row-level security/i.test(error.message)) {
    return "You don't have permission for this action.";
  }
  return error.message;
}

function safeReturn(value: string, fallback: string) {
  if (!value.startsWith("/") || value.startsWith("//") || value.includes("://")) return fallback;
  if (value.startsWith("/training") || value.startsWith("/applicants/")) return value.split("?")[0];
  return fallback;
}

function blank(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  return text === "" ? null : text;
}

export async function saveSession(
  _prev: SessionFormState,
  formData: FormData,
): Promise<SessionFormState> {
  const profile = await requirePermission("manage_training");
  const id = blank(formData.get("id"));
  const applicantId = String(formData.get("applicant_id") ?? "");
  const sessionDate = String(formData.get("session_date") ?? "");
  const start = blank(formData.get("start_time"));
  const end = blank(formData.get("end_time"));
  const vehicle = blank(formData.get("vehicle_type"));
  const instructorId = blank(formData.get("instructor_id"));
  const statusRaw = String(formData.get("status") ?? "scheduled");
  const remarks = blank(formData.get("remarks"));
  const returnTo = safeReturn(String(formData.get("return_to") ?? ""), "/training");

  if (!applicantId) return { error: "Choose an applicant." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) return { error: "Choose a session date." };
  if (!isSessionStatus(statusRaw)) return { error: "Choose a status." };
  if (start && end && end <= start) return { error: "End time must be after the start time." };
  if (vehicle && !VEHICLE_TYPES.includes(vehicle as (typeof VEHICLE_TYPES)[number])) {
    return { error: "Choose a vehicle type." };
  }
  if (remarks && remarks.length > 500) return { error: "Remarks must be 500 characters or fewer." };

  const supabase = await createClient();
  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, school_id")
    .eq("id", applicantId)
    .maybeSingle();
  if (!applicant || applicant.school_id !== profile.school_id) {
    return { error: "That applicant is not in your school." };
  }
  if (instructorId) {
    const { data: instructor } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", instructorId)
      .maybeSingle();
    if (!instructor) return { error: "That instructor is not in your school." };
  }

  const row = {
    applicant_id: applicant.id,
    session_date: sessionDate,
    start_time: start,
    end_time: end,
    vehicle_type: vehicle,
    instructor_id: instructorId,
    status: statusRaw,
    remarks,
  };

  const { error } = id
    ? await supabase.from("training_sessions").update(row).eq("id", id)
    : await supabase.from("training_sessions").insert({
        ...row,
        school_id: applicant.school_id,
        created_by: profile.id,
      });
  if (error) return { error: permissionMessage(error) };

  revalidatePath("/training");
  revalidatePath(`/applicants/${applicant.id}/training`);
  revalidatePath(`/applicants/${applicant.id}/history`);
  revalidatePath("/dashboard");
  redirect(`${returnTo}?notice=saved`);
}

export async function setSessionStatus(formData: FormData) {
  await requirePermission("manage_training");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  const returnTo = safeReturn(String(formData.get("return_to") ?? ""), "/training");
  if (!id || !isSessionStatus(status)) redirect(returnTo);

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("training_sessions")
    .select("applicant_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("training_sessions").update({ status }).eq("id", id);
  if (!error && existing) {
    revalidatePath("/training");
    revalidatePath(`/applicants/${existing.applicant_id}/training`);
    revalidatePath(`/applicants/${existing.applicant_id}/history`);
    revalidatePath("/dashboard");
  }
  redirect(`${returnTo}?notice=${error ? "denied" : "status"}`);
}

export async function deleteSession(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const returnTo = safeReturn(String(formData.get("return_to") ?? ""), "/training");
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("training_sessions")
    .select("applicant_id")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("training_sessions").delete().eq("id", id);
  if (!error && existing) {
    revalidatePath("/training");
    revalidatePath(`/applicants/${existing.applicant_id}/training`);
    revalidatePath(`/applicants/${existing.applicant_id}/history`);
    revalidatePath("/dashboard");
  }
  redirect(`${returnTo}?notice=${error ? "denied" : "deleted"}`);
}
