import { cache } from "react";

import type { Json } from "@/lib/database.types";
import { parsePackages, type CoursePackage } from "@/lib/school/packages";
import { createClient } from "@/lib/supabase/server";

export type OwnSchool = {
  id: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  email: string | null;
  settings: Json;
  packages: CoursePackage[];
};

/** The signed-in user's school. RLS returns only that row. */
export const getOwnSchool = cache(async (): Promise<OwnSchool | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("schools")
    .select("id, name, address, contact_phone, email, settings")
    .limit(1)
    .maybeSingle();
  if (error || !data) return null;
  return { ...data, packages: parsePackages(data.settings) };
});
