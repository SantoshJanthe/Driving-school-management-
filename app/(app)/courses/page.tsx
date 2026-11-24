import type { Metadata } from "next";

import { CourseEditor } from "@/components/courses/course-editor";
import { PageHeader } from "@/components/layout/page-header";
import { requireAdmin } from "@/lib/auth/guards";
import { DEFAULT_PACKAGES } from "@/lib/school/packages";
import { getOwnSchool } from "@/lib/queries/school";

export const metadata: Metadata = { title: "Courses" };

export default async function CoursesPage() {
  await requireAdmin();
  const school = await getOwnSchool();
  const packages = school?.packages ?? DEFAULT_PACKAGES;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Courses"
        description="Change the courses, fees, and session counts for this school."
      />
      <CourseEditor packages={packages} />
    </div>
  );
}
