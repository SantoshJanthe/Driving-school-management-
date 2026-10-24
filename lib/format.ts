const TIMEZONE = "Asia/Kolkata";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrWithPaise = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const integer = new Intl.NumberFormat("en-IN");

/** ₹48,500 (Indian grouping). Shows paise only when the value has them. */
export function formatINR(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  if (!Number.isFinite(n)) return inr.format(0);
  return Number.isInteger(n) ? inr.format(n) : inrWithPaise.format(n);
}

export function formatCount(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return integer.format(Number.isFinite(n) ? n : 0);
}

/** 12 Oct 2026 */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: TIMEZONE,
  }).format(d);
}

/** 12 Oct 2026, 10:15 AM */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TIMEZONE,
  }).format(d);
}

/** 98XXXXXXXX — keeps the first two digits of an Indian mobile number. */
export function maskPhone(phone: string | null | undefined): string {
  if (!phone) return "—";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "X".repeat(digits.length);
  return digits.slice(0, 2) + "X".repeat(digits.length - 2);
}

/** Initials for avatars: "Priya Nair" -> "PN". */
export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}
