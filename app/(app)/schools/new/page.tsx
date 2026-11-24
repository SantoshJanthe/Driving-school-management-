import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/page-header";
import { NewSchoolForm } from "@/components/schools/new-school-form";
import { requirePlatformOwner } from "@/lib/auth/guards";
import { env } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "New school" };

export default async function NewSchoolPage() {
  const profile = await requirePlatformOwner();
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
        description="Opens another school on this software with its own admin login and the password you set. Public sign-up stays off, and the new school's records stay invisible to every other school, including yours."
      />
      <NewSchoolForm currentSchool={school?.name ?? env.appName} />
    </div>
  );
}
