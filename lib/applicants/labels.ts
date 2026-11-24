import type { Enums } from "@/lib/database.types";

export type ApplicationStatus = Enums<"application_status">;
export type TrainingStatus = Enums<"training_status">;
export type Gender = Enums<"gender">;

export const APPLICATION_STATUSES = [
  "enquiry",
  "documents_pending",
  "application_submitted",
  "ll_issued",
  "dl_test_scheduled",
  "dl_issued",
  "rejected",
  "closed",
] as const satisfies readonly ApplicationStatus[];

export const TRAINING_STATUSES = [
  "not_started",
  "in_progress",
  "completed",
  "discontinued",
] as const satisfies readonly TrainingStatus[];

export const GENDERS = ["male", "female", "other"] as const satisfies readonly Gender[];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  enquiry: "Enquiry",
  documents_pending: "Documents pending",
  application_submitted: "Application submitted",
  ll_issued: "LL issued",
  dl_test_scheduled: "DL test scheduled",
  dl_issued: "DL issued",
  rejected: "Rejected",
  closed: "Closed",
};

export const TRAINING_STATUS_LABELS: Record<TrainingStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
  discontinued: "Discontinued",
};

export const GENDER_LABELS: Record<Gender, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
};

export function isApplicationStatus(value: string | undefined): value is ApplicationStatus {
  return APPLICATION_STATUSES.includes(value as ApplicationStatus);
}

export function isTrainingStatus(value: string | undefined): value is TrainingStatus {
  return TRAINING_STATUSES.includes(value as TrainingStatus);
}
