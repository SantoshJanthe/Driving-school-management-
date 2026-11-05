import { PageHeader } from "@/components/layout/page-header";
import { SessionList } from "@/components/training/session-list";
import { formatDate } from "@/lib/format";
import type { SessionRow } from "@/lib/queries/training";
import { kolkataDate } from "@/lib/training/constants";

export function InstructorToday({ rows }: { rows: SessionRow[] }) {
  return (
    <div className="grid gap-5">
      <PageHeader
        title="Today"
        description={`Students on your lessons for ${formatDate(kolkataDate())}. Fees and other staff stay off this page.`}
      />
      <SessionList
        rows={rows}
        returnTo="/dashboard"
        canManage
        isAdmin={false}
        staff={[]}
        showApplicant
      />
    </div>
  );
}
