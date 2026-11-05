import { createClient } from "@/lib/supabase/server";

export type LessonLocation = {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  recorded_at: string;
};

export async function listLessonLocations(): Promise<LessonLocation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_locations")
    .select("id, label, latitude, longitude, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    ...row,
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
  }));
}
