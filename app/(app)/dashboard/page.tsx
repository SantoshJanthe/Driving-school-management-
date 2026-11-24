import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardToasts } from "@/components/dashboard/dashboard-toasts";
import { OpenEnquiries } from "@/components/dashboard/open-enquiries";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivityList } from "@/components/dashboard/recent-activity";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TodaySessions } from "@/components/dashboard/today-sessions";
import { PageHeader } from "@/components/layout/page-header";
import { StudentHomeView } from "@/components/student/student-home";
import { requireProfile } from "@/lib/auth/guards";
import { can, isInstructorOnly } from "@/lib/auth/permissions";
import { getDashboardSummary, getRecentActivity, getTodaySessions } from "@/lib/queries/dashboard";
import { listDaySessions } from "@/lib/queries/training";
import { isIsoDate, kolkataDate } from "@/lib/training/constants";
import { InstructorToday } from "@/components/training/instructor-today";
import { getOpenEnquiries } from "@/lib/queries/enquiries";
import { bookingWindow, listInstructorHours, listOpenSlots } from "@/lib/queries/booking";
import { getStudentHome } from "@/lib/queries/student-home";

export const metadata: Metadata = { title: "Dashboard" };

function greeting() {
  const hour = Number(
    new Intl.DateTimeFormat("en-IN", {
      hour: "numeric",
      hour12: false,
      timeZone: "Asia/Kolkata",
    }).format(new Date()),
  );
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; change?: string }>;
}) {
  const profile = await requireProfile();
  const query = await searchParams;
  if (profile.role === "student") {
    const { today, latest } = bookingWindow();
    const date = isIsoDate(query.date) && query.date >= today && query.date <= latest ? query.date : today;
    const changeId = query.change && /^[0-9a-f-]{36}$/i.test(query.change) ? query.change : undefined;
    const home = await getStudentHome();
    const slots = await listOpenSlots(profile.school_id, date, changeId);
    return (
      <StudentHomeView
        home={home}
        date={date}
        today={today}
        latest={latest}
        slots={slots}
        changeId={changeId}
      />
    );
  }

  if (isInstructorOnly(profile)) {
    const rows = await listDaySessions({ date: kolkataDate(), instructorId: profile.id });
    const hours = await listInstructorHours(profile.id);
    return <InstructorToday rows={rows} instructorId={profile.id} hours={hours} />;
  }

  const canViewApplicants = can(profile, "view_applicants");

  const [summary, sessions, activity, enquiries] = await Promise.all([
    getDashboardSummary(),
    canViewApplicants ? getTodaySessions() : Promise.resolve([]),
    canViewApplicants ? getRecentActivity() : Promise.resolve([]),
    canViewApplicants ? getOpenEnquiries() : Promise.resolve({ total: 0, rows: [] }),
  ]);

  return (
    <div className="grid gap-6">
      <Suspense fallback={null}>
        <DashboardToasts />
      </Suspense>

      <PageHeader
        title={`${greeting()}, ${profile.full_name.split(" ")[0]}`}
        description="Here is what is happening at the school."
        actions={<QuickActions profile={profile} />}
      />

      <SummaryCards summary={summary} />

      {canViewApplicants ? <OpenEnquiries total={enquiries.total} rows={enquiries.rows} /> : null}

      {canViewApplicants ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <TodaySessions sessions={sessions} />
          <RecentActivityList entries={activity} />
        </div>
      ) : null}
    </div>
  );
}
