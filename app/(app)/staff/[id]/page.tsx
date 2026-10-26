import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { StaffEditor } from "@/components/staff/staff-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { resendInvite, setStaffActive } from "@/lib/actions/staff";
import { requireAdmin } from "@/lib/auth/guards";
import { getStaffMember } from "@/lib/queries/staff";

export const metadata: Metadata = { title: "Staff member" };

const NOTICES: Record<string, string> = {
  saved: "Changes saved. Permissions apply on the next request.",
  deactivated: "Account deactivated and signed out.",
  reactivated: "Account reactivated.",
  resent: "Invite sent again.",
  self: "You cannot deactivate yourself or change your own role.",
  denied: "That change was not allowed.",
  "saved-profile-only": "The profile was updated. Session revoke needs the service role key.",
  "invite-failed": "The invite email could not be sent.",
};

export default async function StaffDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ notice?: string }>;
}) {
  const admin = await requireAdmin();
  const { id } = await params;
  const { notice } = await searchParams;
  const member = await getStaffMember(id);
  if (!member) notFound();
  const self = member.id === admin.id;

  return (
    <div className="grid gap-5">
      <Link href="/staff" className="w-fit text-sm text-muted-foreground hover:text-foreground">
        ‹ Staff
      </Link>
      {notice && NOTICES[notice] ? (
        <Alert>
          <AlertDescription>{NOTICES[notice]}</AlertDescription>
        </Alert>
      ) : null}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-medium tracking-tight">{member.full_name}</h2>
          <p className="text-sm text-muted-foreground">{member.email}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!member.last_login_at && member.is_active ? (
            <form action={resendInvite}>
              <input type="hidden" name="id" value={member.id} />
              <Button type="submit" variant="outline" className="h-11">
                Resend invite
              </Button>
            </form>
          ) : null}
          <form action={setStaffActive}>
            <input type="hidden" name="id" value={member.id} />
            <input type="hidden" name="active" value={member.is_active ? "false" : "true"} />
            <Button
              type="submit"
              variant={member.is_active ? "destructive" : "outline"}
              className="h-11"
              disabled={self}
              title={self ? "You cannot deactivate yourself" : undefined}
            >
              {member.is_active ? "Deactivate" : "Reactivate"}
            </Button>
          </form>
        </div>
      </div>
      <StaffEditor member={member} self={self} />
    </div>
  );
}
