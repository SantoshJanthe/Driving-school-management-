export const SESSION_STATUSES = ["scheduled", "completed", "absent", "cancelled"] as const;

export type SessionStatus = (typeof SESSION_STATUSES)[number];

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  scheduled: "Scheduled",
  completed: "Completed",
  absent: "Absent",
  cancelled: "Cancelled",
};

export const VEHICLE_TYPES = ["LMV", "MCWG", "MCWOG", "HMV", "LMV+MCWG"] as const;

export const ATTENDANCE_MARKS = ["present", "absent", "late"] as const;
export type AttendanceMark = (typeof ATTENDANCE_MARKS)[number];
export const ATTENDANCE_LABELS: Record<AttendanceMark, string> = {
  present: "Present",
  absent: "Absent",
  late: "Late",
};
export function isAttendanceMark(value: string): value is AttendanceMark {
  return (ATTENDANCE_MARKS as readonly string[]).includes(value);
}

export function isSessionStatus(value: string): value is SessionStatus {
  return (SESSION_STATUSES as readonly string[]).includes(value);
}

/** Calendar day in Asia/Kolkata, optionally shifted by whole days. */
export function kolkataDate(offsetDays = 0): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const date = new Date(Date.UTC(year, month - 1, day + offsetDays));
  return date.toISOString().slice(0, 10);
}

export function shiftDate(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  if (!year || !month || !day) return kolkataDate();
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function isIsoDate(value: string | undefined): value is string {
  return !!value && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** 0 = Sunday … 6 = Saturday, matching Postgres extract(dow). */
export const WEEKDAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
] as const;

export function weekdayOf(isoDate: string) {
  const weekday = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "Asia/Kolkata",
  }).format(new Date(`${isoDate}T12:00:00+05:30`));
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(weekday);
}

export function clockTime(value: string | null | undefined) {
  return value ? value.slice(0, 5) : "";
}

/** Current time in Asia/Kolkata as HH:MM. */
export function kolkataClock() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const hour = parts.find((part) => part.type === "hour")?.value ?? "00";
  const minute = parts.find((part) => part.type === "minute")?.value ?? "00";
  return `${hour}:${minute}`;
}
