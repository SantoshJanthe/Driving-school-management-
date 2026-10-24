import { UserPlus } from "lucide-react";
import Link from "next/link";

import { ApplicationStatusBadge, TrainingStatusBadge } from "@/components/applicants/status-badge";
import { Button } from "@/components/ui/button";
import { formatINR, formatPhone } from "@/lib/format";
import { PAGE_SIZE, type ApplicantListItem } from "@/lib/queries/applicants";

function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim();
  if (!needle) return text;
  const index = text.toLowerCase().indexOf(needle.toLowerCase());
  if (index < 0) return text;
  return (
    <>
      {text.slice(0, index)}
      <mark className="rounded bg-amber-200/80 px-0.5 text-inherit">
        {text.slice(index, index + needle.length)}
      </mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function ApplicantTable({
  rows,
  total,
  page,
  query,
  canCreate,
  hrefForPage,
}: {
  rows: ApplicantListItem[];
  total: number;
  page: number;
  query: string;
  canCreate: boolean;
  hrefForPage: (page: number) => string;
}) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-16 text-center">
        <p className="font-medium">
          {query ? `No applicants match “${query}”` : "No applicants yet"}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {query
            ? "Try a different name, phone or application number."
            : "Add the first applicant to start tracking their application."}
        </p>
        {canCreate ? (
          <Button asChild>
            <Link href="/applicants/new">
              <UserPlus aria-hidden />
              New applicant
            </Link>
          </Button>
        ) : null}
      </div>
    );
  }

  const from = (page - 1) * PAGE_SIZE + 1;
  const to = from + rows.length - 1;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="grid gap-3">
      <ul className="grid gap-2 md:hidden">
        {rows.map((row) => (
          <li key={row.id}>
            <Link
              href={`/applicants/${row.id}`}
              className="grid gap-1 rounded-xl border p-4 hover:bg-muted/60"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-medium">
                  <Highlight text={row.full_name} query={query} />
                </span>
                <ApplicationStatusBadge status={row.application_status} />
              </span>
              <span className="text-sm text-muted-foreground">
                <Highlight text={row.application_number ?? "—"} query={query} />
                {" · "}
                <Highlight text={formatPhone(row.phone)} query={query} />
              </span>
              <span className="flex items-center justify-between gap-2 text-sm">
                <span>Balance {formatINR(row.balance_due)}</span>
                <TrainingStatusBadge status={row.training_status} />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden overflow-hidden rounded-xl border md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">App. no.</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Balance</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t hover:bg-muted/40">
                <td className="px-4 py-3 font-medium">
                  <Link href={`/applicants/${row.id}`} className="hover:underline">
                    <Highlight text={row.full_name} query={query} />
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  <Highlight text={row.application_number ?? "—"} query={query} />
                </td>
                <td className="px-4 py-3 tabular-nums">
                  <Highlight text={formatPhone(row.phone)} query={query} />
                </td>
                <td className="px-4 py-3">
                  <ApplicationStatusBadge status={row.application_status} />
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{formatINR(row.balance_due)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>
          Showing {from}–{to} of {total}
        </p>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={hrefForPage(page - 1)}>Prev</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Prev
            </Button>
          )}
          {page < pages ? (
            <Button variant="outline" size="sm" asChild>
              <Link href={hrefForPage(page + 1)}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
