"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/guards";
import { can, isInstructorOnly } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { isIsoDate, kolkataDate, WEEKDAYS } from "@/lib/training/constants";

export type BookingState = { error?: string; ok?: boolean };

async function ownApplicantId() {
  const profile = await requireProfile();
  if (profile.role !== "student") return { error: "Only a student can book a lesson." as const };
  const supabase = await createClient();
  const { data } = await supabase.from("student_accounts").select("applicant_id").limit(1).maybeSingle();
  if (!data) return { error: "This login is not connected to a learner record." as const };
  return { profile, supabase, applicantId: data.applicant_id };
}

function clock(value: FormDataEntryValue | null) {
  const text = String(value ?? "").slice(0, 5);
  return /^\d{2}:\d{2}$/.test(text) ? `${text}:00` : "";
}

export async function bookLesson(_prev: BookingState, formData: FormData): Promise<BookingState> {
  const ready = await ownApplicantId();
  if ("error" in ready && ready.error) return { error: ready.error };
  const { profile, supabase, applicantId } = ready as {
    profile: Awaited<ReturnType<typeof requireProfile>>;
    supabase: Awaited<ReturnType<typeof createClient>>;
    applicantId: string;
  };

  const sessionId = String(formData.get("session_id") ?? "").trim();
  const instructorId = String(formData.get("instructor_id") ?? "");
  const sessionDate = String(formData.get("session_date") ?? "");
  const start = clock(formData.get("start_time"));
  const end = clock(formData.get("end_time"));
  if (!instructorId) return { error: "Choose an instructor." };
  if (!isIsoDate(sessionDate) || sessionDate < kolkataDate()) return { error: "Choose a future date." };
  if (!start || !end || end <= start) return { error: "Choose a time slot." };

  const { data: applicant } = await supabase
    .from("applicants")
    .select("id, school_id, license_category")
    .eq("id", applicantId)
    .maybeSingle();
  if (!applicant) return { error: "Learner record is missing." };

  const { count } = await supabase
    .from("training_sessions")
    .select("id", { count: "exact", head: true })
    .eq("applicant_id", applicantId)
    .eq("status", "scheduled")
    .gte("session_date", kolkataDate());
  if (!sessionId && (count ?? 0) >= 8) {
    return { error: "You already have eight upcoming lessons. Change one of those times first." };
  }

  const row = {
    applicant_id: applicant.id,
    session_date: sessionDate,
    start_time: start,
    end_time: end,
    instructor_id: instructorId,
    status: "scheduled" as const,
    vehicle_type: applicant.license_category,
  };

  const { error } = sessionId
    ? await supabase.from("training_sessions").update(row).eq("id", sessionId).eq("applicant_id", applicant.id)
    : await supabase.from("training_sessions").insert({
        ...row,
        school_id: applicant.school_id,
        created_by: profile.id,
      });
  if (error) {
    if (/already has a lesson/i.test(error.message) || /already have a lesson/i.test(error.message)) {
      return { error: error.message };
    }
    if (/available hours/i.test(error.message)) return { error: error.message };
    if (error.code === "42501" || /row-level security/i.test(error.message)) {
      return { error: "That slot is not available." };
    }
    return { error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/training");
  return { ok: true };
}

export async function saveInstructorHours(
  _prev: BookingState,
  formData: FormData,
): Promise<BookingState> {
  const profile = await requireProfile();
  const instructorId = String(formData.get("instructor_id") ?? "");
  const weekday = Number(formData.get("weekday"));
  const start = clock(formData.get("start_time"));
  const end = clock(formData.get("end_time"));
  if (!instructorId) return { error: "Choose an instructor." };
  if (!WEEKDAYS.some((day) => day.value === weekday)) return { error: "Choose a weekday." };
  if (!start || !end || end <= start) return { error: "End time must be after the start time." };

  const ownsHours = isInstructorOnly(profile) && instructorId === profile.id;
  if (!can(profile, "manage_training") && !ownsHours) {
    return { error: "You cannot edit these hours." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("instructor_availability")
    .select("id", { count: "exact", head: true })
    .eq("instructor_id", instructorId);
  if ((count ?? 0) >= 40) return { error: "Remove an old slot before adding another." };

  const { error } = await supabase.from("instructor_availability").insert({
    school_id: profile.school_id,
    instructor_id: instructorId,
    weekday,
    start_time: start,
    end_time: end,
  });
  if (error) {
    if (error.code === "23505") return { error: "That hour is already on the list." };
    return { error: error.message };
  }
  revalidatePath("/dashboard");
  revalidatePath("/training");
  revalidatePath(`/staff/${instructorId}`);
  return { ok: true };
}

export async function removeInstructorHour(formData: FormData) {
  const profile = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const instructorId = String(formData.get("instructor_id") ?? "");
  if (!id) return;
  const ownsHours = isInstructorOnly(profile) && instructorId === profile.id;
  if (!can(profile, "manage_training") && !ownsHours) return;
  const supabase = await createClient();
  await supabase.from("instructor_availability").delete().eq("id", id);
  revalidatePath("/dashboard");
  revalidatePath("/training");
  revalidatePath(`/staff/${instructorId}`);
}
