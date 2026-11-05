import { IndianRupee, UserPlus } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/auth/get-profile";
import { can } from "@/lib/auth/permissions";

/** Primary actions; each is hidden unless the user holds the matching permission. */
export function QuickActions({ profile }: { profile: Profile }) {
  const actions = [
    can(profile, "create_applicant") && (
      <Button key="new-applicant" asChild className="h-11 flex-1 sm:h-9 sm:flex-none">
        <Link href="/applicants/new">
          <UserPlus aria-hidden />
          New applicant
        </Link>
      </Button>
    ),
    can(profile, "add_payment") && (
      <Button
        key="record-payment"
        asChild
        variant="outline"
        className="h-11 flex-1 sm:h-9 sm:flex-none"
      >
        <Link href="/payments">
          <IndianRupee aria-hidden />
          Record payment
        </Link>
      </Button>
    ),
  ].filter(Boolean);

  if (actions.length === 0) return null;
  return <div className="flex flex-wrap gap-2">{actions}</div>;
}
