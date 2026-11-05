"use server";

import { revalidatePath } from "next/cache";

import { requireProfile } from "@/lib/auth/guards";
import { isInstructorOnly } from "@/lib/auth/permissions";
import { createClient } from "@/lib/supabase/server";
import { kolkataDate } from "@/lib/training/constants";

export type LocationState = { error?: string; ok?: boolean };

export async function saveLessonLocation(
  _prev: LocationState,
  formData: FormData,
): Promise<LocationState> {
  const profile = await requireProfile();
  if (!isInstructorOnly(profile)) return { error: "Only an instructor can save a lesson location." };

  const sessionId = String(formData.get("session_id") ?? "");
  const label = String(formData.get("label") ?? "").trim();
  const latitude = Number(formData.get("latitude"));
  const longitude = Number(formData.get("longitude"));
  if (!sessionId) return { error: "Choose a lesson." };
  if (label.length < 1 || label.length > 80) return { error: "Enter a short place name." };
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) return { error: "Enter a latitude." };
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return { error: "Enter a longitude." };
  }

  const supabase = await createClient();
  const { data: session } = await supabase
    .from("training_sessions")
    .select("id, school_id, vehicle_id, instructor_id, session_date")
    .eq("id", sessionId)
    .maybeSingle();
  if (
    !session ||
    session.school_id !== profile.school_id ||
    session.instructor_id !== profile.id ||
    session.session_date !== kolkataDate()
  ) {
    return { error: "That lesson is not on your list for today." };
  }

  const { error } = await supabase.from("lesson_locations").insert({
    school_id: session.school_id,
    session_id: session.id,
    vehicle_id: session.vehicle_id,
    label,
    latitude,
    longitude,
    recorded_by: profile.id,
  });
  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  revalidatePath("/training");
  return { ok: true };
}
