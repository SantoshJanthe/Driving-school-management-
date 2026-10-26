import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { InviteDialog } from "@/components/staff/invite-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { requireAdmin } from "@/lib/auth/guards";
import { formatDateTime } from "@/lib/format";
import { listStaff } from "@/lib/queries/staff";

export const metadata: Metadata = { title: "Staff" };

const NOTICES: Record<string, string> = {
  invited: "Invite sent.",
};

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const { notice } = await searchParams;
  const staff = await listStaff();

  return (
    <div className="grid gap-5">
      {notice && NOTICES[notice] ? (
        <Alert>
          <AlertDescription>{NOTICES[notice]}</AlertDescription>
        </Alert>
      ) : null}
      <PageHeader
        title="Staff"
        description="Invite people, set what they can do, and deactivate an account when they leave."
        actions={<InviteDialog />}
      />
      <div className="overflow-hidden rounded-2xl border border-black/10 bg-[#fffcf7]">
        <table className="w-full text-sm">
          <thead className="text-left text-xs tracking-wide text-[#6b6560] uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="hidden px-4 py-3 font-medium md:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="hidden px-4 py-3 font-medium lg:table-cell">Last login</th>
              <th className="px-4 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {staff.map((member) => {
              const status = !member.is_active
                ? "Inactive"
                : member.last_login_at
                  ? "Active"
                  : "Invited";
              return (
                <tr key={member.id} className="border-t border-black/10">
                  <td className="px-4 py-3">
                    <Link href={`/staff/${member.id}`} className="font-medium hover:underline">
                      {member.full_name}
                    </Link>
                    <div className="text-xs text-muted-foreground md:hidden">{member.email}</div>
                  </td>
                  <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                    {member.email}
                  </td>
                  <td className="px-4 py-3 capitalize">{member.role}</td>
                  <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                    {member.last_login_at ? formatDateTime(member.last_login_at) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={status === "Inactive" ? "outline" : "secondary"}>
                      {status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
