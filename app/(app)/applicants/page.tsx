import type { Metadata } from "next";
import { UserPlus } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";

import { ApplicantFilters } from "@/components/applicants/applicant-filters";
import { ApplicantTable } from "@/components/applicants/applicant-table";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { requirePermission } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";
import { listApplicants, listStaffOptions } from "@/lib/queries/applicants";

export const metadata: Metadata = { title: "Applicants" };

type SearchParams = Promise<{
  q?: string;
  status?: string;
  training?: string;
  staff?: string;
  page?: string;
  notice?: string;
}>;

function pageHref(current: URLSearchParams, page: number) {
  const next = new URLSearchParams(current);
  next.delete("notice");
  if (page <= 1) next.delete("page");
  else next.set("page", String(page));
  const query = next.toString();
  return query ? `/applicants?${query}` : "/applicants";
}

export default async function ApplicantsPage({ searchParams }: { searchParams: SearchParams }) {
  const profile = await requirePermission("view_applicants");
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const query = params.q?.trim() ?? "";
  const canCreate = can(profile, "create_applicant");

  const [staff, result] = await Promise.all([
    listStaffOptions(),
    listApplicants({
      q: query,
      status: params.status,
      training: params.training,
      staff: params.staff,
      page,
    }),
  ]);

  const current = new URLSearchParams();
  if (query) current.set("q", query);
  if (params.status) current.set("status", params.status);
  if (params.training) current.set("training", params.training);
  if (params.staff) current.set("staff", params.staff);

  return (
    <div className="grid gap-5">
      {params.notice === "deleted" ? (
        <Alert>
          <AlertDescription>Applicant deleted. The history entry is kept.</AlertDescription>
        </Alert>
      ) : null}

      <PageHeader
        title="Applicants"
        description="Search by name, phone or application number."
        actions={
          canCreate ? (
            <Button asChild className="hidden h-9 md:inline-flex">
              <Link href="/applicants/new">
                <UserPlus aria-hidden />
                New applicant
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Suspense>
        <ApplicantFilters staff={staff} />
      </Suspense>

      <ApplicantTable
        rows={result.rows}
        total={result.total}
        page={page}
        query={query}
        canCreate={canCreate}
        hrefForPage={(nextPage) => pageHref(current, nextPage)}
      />

      {canCreate ? (
        <Button
          asChild
          className="fixed right-4 bottom-20 z-30 size-14 rounded-full shadow-lg md:hidden"
        >
          <Link href="/applicants/new" aria-label="New applicant">
            <UserPlus className="size-6" />
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
