import { CarFront, ClipboardList, FileText, IndianRupee, Users, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCount, formatINR } from "@/lib/format";
import type { DashboardSummary } from "@/lib/queries/dashboard";

function SummaryCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-0">
        <CardTitle className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          {title}
        </CardTitle>
        <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-semibold tabular-nums md:text-3xl">{value}</p>
        {detail ? <p className="mt-1 text-xs text-muted-foreground">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

/**
 * The five cards from the spec plus two financial cards that the RPC only
 * returns for admins / staff with `view_financials`.
 */
export function SummaryCards({ summary }: { summary: DashboardSummary }) {
  const hasFinancials = summary.total_balance_due !== undefined;

  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      <SummaryCard
        title="Total applicants"
        value={formatCount(summary.total_applicants)}
        icon={Users}
      />
      <SummaryCard
        title="Active trainees"
        value={formatCount(summary.active_trainees)}
        icon={CarFront}
      />
      <SummaryCard
        title="Pending payments"
        value={formatCount(summary.applicants_with_balance)}
        detail={
          hasFinancials
            ? `${formatINR(summary.total_balance_due)} outstanding`
            : "applicants with a balance"
        }
        icon={Wallet}
      />
      <SummaryCard
        title="Docs this month"
        value={formatCount(summary.documents_this_month)}
        icon={FileText}
      />
      <SummaryCard
        title="Applications in progress"
        value={formatCount(summary.applications_in_progress)}
        icon={ClipboardList}
      />
      {hasFinancials ? (
        <SummaryCard
          title="Collected this month"
          value={formatINR(summary.collected_this_month)}
          icon={IndianRupee}
        />
      ) : null}
    </div>
  );
}

export function SummaryCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-0">
            <Skeleton className="h-3 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
