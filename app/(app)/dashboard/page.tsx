import type { Metadata } from "next";
import { Suspense } from "react";

import { DashboardToasts } from "@/components/dashboard/dashboard-toasts";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RecentActivityList } from "@/components/dashboard/recent-activity";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { TodaySessions } from "@/components/dashboard/today-sessions";
import { PageHeader } from "@/components/layout/page-header";
import { requireProfile } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { getDashboardSummary, getRecentActivity, getTodaySessions } from "@/lib/queries/dashboard";

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

export default async function DashboardPage() {
  const profile = await requireProfile();
  const canViewApplicants = can(profile, "view_applicants");

  const [summary, sessions, activity] = await Promise.all([
    getDashboardSummary(),
    canViewApplicants ? getTodaySessions() : Promise.resolve([]),
    canViewApplicants ? getRecentActivity() : Promise.resolve([]),
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

      {canViewApplicants ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <TodaySessions sessions={sessions} />
          <RecentActivityList entries={activity} />
        </div>
      ) : null}
    </div>
  );
}
