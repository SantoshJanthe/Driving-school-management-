import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { AddVehicleForm } from "@/components/training/add-vehicle-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { listSessionsBetween, listVehicles } from "@/lib/queries/training";
import { formatDate } from "@/lib/format";
import { isIsoDate, kolkataDate, shiftDate } from "@/lib/training/constants";

export const metadata: Metadata = { title: "Timetable" };

function mondayOf(iso: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${iso}T12:00:00+05:30`));
  const index = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
  const offset = index === 0 ? -6 : 1 - index;
  return shiftDate(iso, offset);
}

export default async function WeekTimetablePage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; notice?: string }>;
}) {
  const profile = await requirePermission("view_applicants");
  const query = await searchParams;
  const anchor = isIsoDate(query.date) ? query.date : kolkataDate();
  const start = mondayOf(anchor);
  const days = Array.from({ length: 7 }, (_, index) => shiftDate(start, index));
  const [sessions, vehicles] = await Promise.all([
    listSessionsBetween(days[0], days[6]),
    listVehicles(),
  ]);
  const canManage = can(profile, "manage_training");

  const instructors = [...new Set(sessions.map((row) => row.instructor_name ?? "Unassigned"))];

  return (
    <div className="grid gap-5">
      {query.notice === "vehicle" ? (
        <Alert>
          <AlertDescription>Vehicle added.</AlertDescription>
        </Alert>
      ) : null}
      <PageHeader
        title="Timetable"
        description="Lessons for the week, by vehicle and by instructor. A vehicle cannot take two lessons at the same time."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/training/week?date=${shiftDate(start, -7)}`}>Previous week</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/training/week">This week</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/training/week?date=${shiftDate(start, 7)}`}>Next week</Link>
            </Button>
          </div>
        }
      />
      <p className="text-sm text-muted-foreground">
        {formatDate(days[0])} – {formatDate(days[6])}
      </p>

      <Timetable
        title="Vehicles"
        rows={vehicles.map((vehicle) => ({
          key: vehicle.id,
          label: vehicle.name,
          cells: days.map((day) =>
            sessions.filter((row) => row.session_date === day && row.vehicle_id === vehicle.id),
          ),
        }))}
        days={days}
      />
      <Timetable
        title="Instructors"
        rows={instructors.map((name) => ({
          key: name,
          label: name,
          cells: days.map((day) =>
            sessions.filter(
              (row) => row.session_date === day && (row.instructor_name ?? "Unassigned") === name,
            ),
          ),
        }))}
        days={days}
      />
      {canManage ? <AddVehicleForm /> : null}
    </div>
  );
}

function Timetable({
  title,
  rows,
  days,
}: {
  title: string;
  days: string[];
  rows: {
    key: string;
    label: string;
    cells: {
      id: string;
      start_time: string | null;
      end_time: string | null;
      applicant_name: string | null;
      instructor_name: string | null;
      vehicle_name: string | null;
    }[][];
  }[];
}) {
  return (
    <section className="grid gap-2" aria-labelledby={`${title}-heading`}>
      <h2 id={`${title}-heading`} className="text-sm font-semibold tracking-wide uppercase">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing to show yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[52rem] border-collapse text-sm">
            <thead>
              <tr className="border-b bg-[#fffcf7] text-left">
                <th className="p-2 font-medium">{title.slice(0, -1)}</th>
                {days.map((day) => (
                  <th key={day} className="p-2 font-medium">
                    {formatDate(day)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b align-top">
                  <th className="p-2 text-left font-medium">{row.label}</th>
                  {row.cells.map((lessons, index) => (
                    <td key={days[index]} className="p-2">
                      {lessons.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <ul className="grid gap-1">
                          {lessons.map((lesson) => (
                            <li key={lesson.id}>
                              {clock(lesson.start_time)}–{clock(lesson.end_time)}{" "}
                              {lesson.applicant_name}
                              <span className="block text-xs text-muted-foreground">
                                {title === "Vehicles" ? lesson.instructor_name : lesson.vehicle_name}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function clock(value: string | null) {
  return value ? value.slice(0, 5) : "";
}
