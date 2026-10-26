"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { PermissionsEditor } from "@/components/staff/permissions-editor";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateStaff, type StaffFormState } from "@/lib/actions/staff";
import type { StaffMember } from "@/lib/queries/staff";

const initial: StaffFormState = {};

export function StaffEditor({ member, self }: { member: StaffMember; self: boolean }) {
  const [state, action] = useActionState(updateStaff, initial);
  const [role, setRole] = useState(member.role);

  return (
    <form
      action={action}
      className="grid max-w-2xl gap-4 rounded-2xl border border-black/10 bg-[#fffcf7] p-4 md:p-6"
    >
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <input type="hidden" name="id" value={member.id} />
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-1.5">
          <Label htmlFor="staff-name">Full name</Label>
          <Input
            id="staff-name"
            name="full_name"
            required
            defaultValue={member.full_name}
            className="h-11"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="staff-phone">Phone</Label>
          <Input
            id="staff-phone"
            name="phone"
            inputMode="tel"
            defaultValue={member.phone ?? ""}
            className="h-11"
          />
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        Email {member.email}. Change it by sending a new invite.
      </p>
      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">Role</legend>
        {self ? <input type="hidden" name="role" value={member.role} /> : null}
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name="role"
            value="admin"
            checked={role === "admin"}
            disabled={self}
            onChange={() => setRole("admin")}
          />
          Admin
        </label>
        <label className="flex min-h-11 items-center gap-2 text-sm">
          <input
            type="radio"
            name="role"
            value="staff"
            checked={role === "staff"}
            disabled={self}
            onChange={() => setRole("staff")}
          />
          Staff
        </label>
        {self ? (
          <p className="text-xs text-muted-foreground">You cannot change your own role.</p>
        ) : null}
      </fieldset>
      {role === "staff" ? <PermissionsEditor permissions={member.permissions} /> : null}
      <SubmitButton pendingText="Saving…" className="md:w-fit">
        Save changes
      </SubmitButton>
    </form>
  );
}
