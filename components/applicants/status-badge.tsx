import {
  APPLICATION_STATUS_LABELS,
  TRAINING_STATUS_LABELS,
  type ApplicationStatus,
  type TrainingStatus,
} from "@/lib/applicants/labels";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const APPLICATION_DOT: Record<ApplicationStatus, string> = {
  enquiry: "bg-sky-500",
  documents_pending: "bg-amber-500",
  application_submitted: "bg-indigo-500",
  ll_issued: "bg-emerald-500",
  dl_test_scheduled: "bg-violet-500",
  dl_issued: "bg-emerald-600",
  rejected: "bg-destructive",
  closed: "bg-muted-foreground",
};

const TRAINING_DOT: Record<TrainingStatus, string> = {
  not_started: "bg-muted-foreground",
  in_progress: "bg-amber-500",
  completed: "bg-emerald-600",
  discontinued: "bg-destructive",
};

export function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <Badge variant="outline" className="h-6 gap-1.5 px-2 font-medium">
      <span className={cn("size-1.5 rounded-full", APPLICATION_DOT[status])} aria-hidden />
      {APPLICATION_STATUS_LABELS[status]}
    </Badge>
  );
}

export function TrainingStatusBadge({ status }: { status: TrainingStatus }) {
  return (
    <Badge variant="outline" className="h-6 gap-1.5 px-2 font-medium">
      <span className={cn("size-1.5 rounded-full", TRAINING_DOT[status])} aria-hidden />
      {TRAINING_STATUS_LABELS[status]}
    </Badge>
  );
}
