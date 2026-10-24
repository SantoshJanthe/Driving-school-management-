import { Check, RotateCcw, X } from "lucide-react";

import { deleteSession, setSessionStatus } from "@/lib/actions/training";
import { Button } from "@/components/ui/button";
import type { SessionStatus } from "@/lib/training/constants";

export function SessionActions({
  id,
  status,
  returnTo,
  canManage,
  isAdmin,
}: {
  id: string;
  status: SessionStatus;
  returnTo: string;
  canManage: boolean;
  isAdmin: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {canManage && status === "scheduled" ? (
        <>
          <StatusButton id={id} returnTo={returnTo} status="completed" label="Mark completed">
            <Check aria-hidden />
          </StatusButton>
          <StatusButton id={id} returnTo={returnTo} status="absent" label="Mark absent">
            <X aria-hidden />
          </StatusButton>
        </>
      ) : null}
      {canManage && status !== "scheduled" ? (
        <StatusButton id={id} returnTo={returnTo} status="scheduled" label="Undo">
          <RotateCcw aria-hidden />
          Undo
        </StatusButton>
      ) : null}
      {isAdmin ? (
        <form action={deleteSession}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="return_to" value={returnTo} />
          <Button type="submit" variant="ghost" size="sm" className="text-destructive">
            Delete
          </Button>
        </form>
      ) : null}
    </div>
  );
}

function StatusButton({
  id,
  returnTo,
  status,
  label,
  children,
}: {
  id: string;
  returnTo: string;
  status: SessionStatus;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <form action={setSessionStatus}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="status" value={status} />
      <input type="hidden" name="return_to" value={returnTo} />
      <Button type="submit" variant="outline" size="sm" aria-label={label} className="h-11">
        {children}
      </Button>
    </form>
  );
}
