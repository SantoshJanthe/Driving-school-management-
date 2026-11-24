import { createClient } from "@/lib/supabase/server";

export type LessonLocation = {
  id: string;
  label: string;
  number_plate: string;
  recorded_at: string;
};

export async function listLessonLocations(): Promise<LessonLocation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lesson_locations")
    .select("id, label, number_plate, recorded_at")
    .order("recorded_at", { ascending: false })
    .limit(8);
  if (error) throw new Error(error.message);
  return data ?? [];
}
