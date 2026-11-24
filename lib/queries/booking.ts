import "server-only";

import { createClient } from "@/lib/supabase/server";
import {
  clockTime,
  kolkataClock,
  kolkataDate,
  shiftDate,
  weekdayOf,
} from "@/lib/training/constants";

export type InstructorHours = {
  id: string;
  instructor_id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
};

export type OpenSlot = {
  instructor_id: string;
  instructor_name: string;
  session_date: string;
  start_time: string;
  end_time: string;
};

export async function listInstructorHours(instructorId: string): Promise<InstructorHours[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("instructor_availability")
    .select("id, instructor_id, weekday, start_time, end_time, is_active")
    .eq("instructor_id", instructorId)
    .order("weekday")
    .order("start_time");
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    start_time: clockTime(row.start_time),
    end_time: clockTime(row.end_time),
  }));
}

function overlaps(
  start: string,
  end: string,
  otherStart: string | null,
  otherEnd: string | null,
) {
  const a = clockTime(otherStart);
  const b = clockTime(otherEnd);
  if (!a || !b) return false;
  return a < end && start < b;
}

/** Free instructor hours on one calendar day, skipping lessons already booked. */
export async function listOpenSlots(
  schoolId: string,
  day: string,
  ignoreSessionId?: string,
): Promise<OpenSlot[]> {
  const supabase = await createClient();
  const weekday = weekdayOf(day);
  const today = kolkataDate();
  const now = kolkataClock();
  const [{ data: hours }, { data: instructors }, { data: taken }] = await Promise.all([
    supabase
      .from("instructor_availability")
      .select("instructor_id, start_time, end_time")
      .eq("school_id", schoolId)
      .eq("weekday", weekday)
      .eq("is_active", true),
    supabase
      .from("profiles")
      .select("id, full_name")
      .eq("school_id", schoolId)
      .eq("is_instructor", true)
      .eq("is_active", true),
    supabase
      .from("instructor_busy_slots")
      .select("id, instructor_id, start_time, end_time")
      .eq("school_id", schoolId)
      .eq("session_date", day),
  ]);

  const names = new Map((instructors ?? []).map((row) => [row.id, row.full_name]));
  const slots: OpenSlot[] = [];
  for (const hour of hours ?? []) {
    const start = clockTime(hour.start_time);
    const end = clockTime(hour.end_time);
    if (!start || !end) continue;
    if (day < today || (day === today && start <= now)) continue;
    const name = names.get(hour.instructor_id);
    if (!name) continue;
    const busy = (taken ?? []).some(
      (row) =>
        row.id !== ignoreSessionId &&
        row.instructor_id === hour.instructor_id &&
        overlaps(start, end, row.start_time, row.end_time),
    );
    if (busy) continue;
    slots.push({
      instructor_id: hour.instructor_id,
      instructor_name: name,
      session_date: day,
      start_time: start,
      end_time: end,
    });
  }
  return slots.sort(
    (a, b) => a.start_time.localeCompare(b.start_time) || a.instructor_name.localeCompare(b.instructor_name),
  );
}

export function bookingWindow() {
  const today = kolkataDate();
  return { today, latest: shiftDate(today, 14) };
}
