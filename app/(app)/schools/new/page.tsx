import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { NewSchoolForm } from "@/components/schools/new-school-form";
import { requireAdmin } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New school" };

export default async function NewSchoolPage() {
  const profile = await requireAdmin();
  const supabase = await createClient();
  const { data: school } = await supabase
    .from("schools")
    .select("name")
    .eq("id", profile.school_id)
    .maybeSingle();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="New school"
        description="Creates another school and its first admin. Public sign-up stays off. You will not be able to open that school's records."
      />
      <NewSchoolForm currentSchool={school?.name ?? env.appName} />
    </div>
  );
}
