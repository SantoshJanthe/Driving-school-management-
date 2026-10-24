import type { Metadata } from "next";

import { SessionDialog } from "@/components/training/session-dialog";
import { SessionList } from "@/components/training/session-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { requirePermission } from "@/lib/auth/guards";
import { can, isAdmin } from "@/lib/auth/permissions";
import { listApplicantSessions, listTrainingStaff, sessionTarget } from "@/lib/queries/training";

export const metadata: Metadata = { title: "Training" };

const NOTICES: Record<string, string> = {
  saved: "Session saved.",
  status: "Session updated.",
  deleted: "Session deleted.",
  denied: "You don't have permission for that action.",
};

export default async function ApplicantTrainingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const profile = await requirePermission("view_applicants");
  const { id } = await params;
  const query = await searchParams;
  const canManage = can(profile, "manage_training");
  const [rows, staff, target] = await Promise.all([
    listApplicantSessions(id),
    listTrainingStaff(),
    sessionTarget(profile.school_id),
  ]);
  const completed = rows.filter((row) => row.status === "completed").length;
  const width = Math.min(100, Math.round((completed / target) * 100));

  return (
    <div className="grid gap-4">
      {query.notice && NOTICES[query.notice] ? (
        <Alert>
          <AlertDescription>{NOTICES[query.notice]}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid min-w-48 flex-1 gap-2">
          <p className="text-sm font-medium">
            Training progress: {completed} of {target} sessions completed
          </p>
          <div
            className="h-2 overflow-hidden rounded-full bg-muted"
            role="meter"
            aria-valuenow={completed}
            aria-valuemin={0}
            aria-valuemax={target}
          >
            <div className="h-full bg-primary" style={{ width: `${width}%` }} />
          </div>
        </div>
        {canManage ? (
          <SessionDialog
            staff={staff}
            returnTo={`/applicants/${id}/training`}
            lockedApplicantId={id}
          />
        ) : null}
      </div>
      <SessionList
        rows={rows}
        returnTo={`/applicants/${id}/training`}
        canManage={canManage}
        isAdmin={isAdmin(profile)}
        staff={staff}
        showDate
      />
    </div>
  );
}
