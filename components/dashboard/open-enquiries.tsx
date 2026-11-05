import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatPhone } from "@/lib/format";
import type { OpenEnquiry } from "@/lib/queries/enquiries";

export function OpenEnquiries({ total, rows }: { total: number; rows: OpenEnquiry[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-3">
        <div className="grid gap-1">
          <CardTitle>Open enquiries</CardTitle>
          <p className="text-sm text-muted-foreground">
            {total === 0
              ? "Website enquiries land here as applicants."
              : `${total} waiting for the office to call.`}
          </p>
        </div>
        <Button asChild variant="outline" className="h-9">
          <Link href="/applicants?status=enquiry">Review</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No open enquiries.</p>
        ) : (
          <ul className="grid gap-3">
            {rows.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/applicants/${row.id}`}
                  className="grid gap-0.5 rounded-lg hover:bg-black/5"
                >
                  <span className="font-medium">{row.full_name}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatPhone(row.phone)}
                    {row.license_category ? ` · ${row.license_category}` : ""}
                    {` · ${formatDate(row.created_at)}`}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
