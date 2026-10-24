import type { Enums, Json } from "@/lib/database.types";

/**
 * Staff permission toggles stored in `profiles.permissions` (JSONB). Admins
 * ignore this object: `can()` returns true for every key. Keys mirror
 * `app.default_staff_permissions()` in the migration; the database's
 * `app.has_permission()` is the enforcement layer, these helpers only shape UX.
 */
export const PERMISSION_KEYS = [
  "view_applicants",
  "create_applicant",
  "edit_applicant",
  "add_payment",
  "manage_training",
  "view_financials",
] as const;

export type Permission = (typeof PERMISSION_KEYS)[number];
export type Permissions = Record<Permission, boolean>;
export type Role = Enums<"user_role">;

export const PERMISSION_LABELS: Record<Permission, string> = {
  view_applicants: "View applicants",
  create_applicant: "Create applicants",
  edit_applicant: "Edit applicants",
  add_payment: "Add payments",
  manage_training: "Manage training sessions",
  view_financials: "View financial summary",
};

export const DEFAULT_STAFF_PERMISSIONS: Permissions = {
  view_applicants: true,
  create_applicant: false,
  edit_applicant: false,
  add_payment: false,
  manage_training: true,
  view_financials: false,
};

/** Coerces the raw JSONB column into a fully-populated Permissions object. */
export function parsePermissions(raw: Json | null | undefined): Permissions {
  const source =
    raw && typeof raw === "object" && !Array.isArray(raw) ? (raw as Record<string, Json>) : {};
  const result = { ...DEFAULT_STAFF_PERMISSIONS };
  for (const key of PERMISSION_KEYS) {
    const value = source[key];
    result[key] = value === undefined ? DEFAULT_STAFF_PERMISSIONS[key] : value === true;
  }
  return result;
}

export type PermissionSubject = { role: Role; permissions: Permissions; is_active: boolean };

export function can(subject: PermissionSubject | null | undefined, key: Permission): boolean {
  if (!subject || !subject.is_active) return false;
  if (subject.role === "admin") return true;
  return subject.permissions[key] === true;
}

export function isAdmin(subject: PermissionSubject | null | undefined): boolean {
  return !!subject && subject.is_active && subject.role === "admin";
}
