import type { Metadata } from "next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { SessionDialog } from "@/components/training/session-dialog";
import { SessionList } from "@/components/training/session-list";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { can, isAdmin } from "@/lib/auth/permissions";
import { listDaySessions, listTrainingApplicants, listTrainingStaff } from "@/lib/queries/training";
import { formatDate } from "@/lib/format";
import { isIsoDate, kolkataDate, shiftDate, VEHICLE_TYPES } from "@/lib/training/constants";

export const metadata: Metadata = { title: "Training" };

const NOTICES: Record<string, string> = {
  saved: "Session saved.",
  status: "Session updated.",
  deleted: "Session deleted.",
  denied: "You don't have permission for that action.",
};

function dayLabel(iso: string) {
  const date = new Date(`${iso}T12:00:00+05:30`);
  const weekday = new Intl.DateTimeFormat("en-IN", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(date);
  return `${weekday} ${formatDate(iso)}`;
}

export default async function TrainingPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    instructor?: string;
    vehicle?: string;
    notice?: string;
  }>;
}) {
  const profile = await requirePermission("view_applicants");
  const query = await searchParams;
  const date = isIsoDate(query.date) ? query.date : kolkataDate();
  const today = kolkataDate();
  const instructor = query.instructor || undefined;
  const vehicle = query.vehicle || undefined;
  const canManage = can(profile, "manage_training");
  const [rows, staff, applicants] = await Promise.all([
    listDaySessions({ date, instructorId: instructor, vehicle }),
    listTrainingStaff(),
    listTrainingApplicants(),
  ]);
  const completed = rows.filter((row) => row.status === "completed").length;
  const absent = rows.filter((row) => row.status === "absent").length;
  const returnTo = `/training?date=${date}`;

  function href(nextDate: string) {
    const params = new URLSearchParams();
    if (nextDate !== today) params.set("date", nextDate);
    if (instructor) params.set("instructor", instructor);
    if (vehicle) params.set("vehicle", vehicle);
    const search = params.toString();
    return search ? `/training?${search}` : "/training";
  }

  return (
    <div className="grid gap-5">
      {query.notice && NOTICES[query.notice] ? (
        <Alert>
          <AlertDescription>{NOTICES[query.notice]}</AlertDescription>
        </Alert>
      ) : null}
      <PageHeader
        title="Training"
        description="Sessions for one day, across every applicant."
        actions={
          canManage ? (
            <SessionDialog applicants={applicants} staff={staff} returnTo={returnTo} />
          ) : undefined
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="icon" asChild aria-label="Previous day">
          <Link href={href(shiftDate(date, -1))}>
            <ChevronLeft />
          </Link>
        </Button>
        <p className="min-w-40 text-center text-sm font-semibold">{dayLabel(date)}</p>
        <Button variant="outline" size="icon" asChild aria-label="Next day">
          <Link href={href(shiftDate(date, 1))}>
            <ChevronRight />
          </Link>
        </Button>
        {date !== today ? (
          <Button variant="ghost" asChild>
            <Link href={href(today)}>Today</Link>
          </Button>
        ) : null}
      </div>

      <form method="get" className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="date" value={date} />
        <select
          name="instructor"
          defaultValue={instructor ?? ""}
          aria-label="Instructor"
          className="h-11 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All instructors</option>
          {staff.map((member) => (
            <option key={member.id} value={member.id}>
              {member.full_name}
            </option>
          ))}
        </select>
        <select
          name="vehicle"
          defaultValue={vehicle ?? ""}
          aria-label="Vehicle"
          className="h-11 rounded-lg border border-input bg-background px-2.5 text-sm"
        >
          <option value="">All vehicles</option>
          {VEHICLE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
        <Button type="submit" variant="outline" className="h-11">
          Filter
        </Button>
      </form>

      <SessionList
        rows={rows}
        returnTo={returnTo}
        canManage={canManage}
        isAdmin={isAdmin(profile)}
        staff={staff}
        showApplicant
      />
      <p className="text-sm text-muted-foreground">
        {rows.length} {rows.length === 1 ? "session" : "sessions"} · {completed} completed ·{" "}
        {absent} absent
      </p>
    </div>
  );
}
