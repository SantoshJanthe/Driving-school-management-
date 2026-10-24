"use client";

import { useSearchParams } from "next/navigation";

import { Alert, AlertDescription } from "@/components/ui/alert";

const NOTICES: Record<string, string> = {
  created: "Applicant created.",
  updated: "Changes saved.",
  status: "Status updated.",
};

export function ApplicantNotice() {
  const notice = useSearchParams().get("notice");
  if (!notice || !NOTICES[notice]) return null;
  return (
    <Alert>
      <AlertDescription>{NOTICES[notice]}</AlertDescription>
    </Alert>
  );
}
