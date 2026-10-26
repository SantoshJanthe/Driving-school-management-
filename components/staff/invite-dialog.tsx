"use client";

import { UserPlus } from "lucide-react";
import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { PermissionsEditor } from "@/components/staff/permissions-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { inviteStaff, type StaffFormState } from "@/lib/actions/staff";
import { DEFAULT_STAFF_PERMISSIONS } from "@/lib/auth/permissions";

const initial: StaffFormState = {};
const selectClass =
  "border-input h-11 w-full rounded-lg border bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function InviteDialog() {
  const [state, action] = useActionState(inviteStaff, initial);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="h-11">
          <UserPlus aria-hidden />
          Invite staff
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite staff</DialogTitle>
          <DialogDescription>
            They receive an email to set a password. The row shows Invited until the first sign-in.
          </DialogDescription>
        </DialogHeader>
        <form action={action} className="grid gap-4">
          {state.error ? (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="grid gap-1.5">
            <Label htmlFor="invite-name">Full name</Label>
            <Input id="invite-name" name="full_name" required className="h-11" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="invite-email">Email</Label>
            <Input id="invite-email" name="email" type="email" required className="h-11" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="invite-phone">Phone</Label>
            <Input id="invite-phone" name="phone" inputMode="tel" className="h-11" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="invite-role">Role</Label>
            <select id="invite-role" name="role" defaultValue="staff" className={selectClass}>
              <option value="staff">Staff</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <PermissionsEditor permissions={DEFAULT_STAFF_PERMISSIONS} />
          <SubmitButton pendingText="Sending invite…" className="md:w-fit">
            Send invite
          </SubmitButton>
        </form>
      </DialogContent>
    </Dialog>
  );
}
