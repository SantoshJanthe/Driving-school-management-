import { z } from "zod";

import { APPLICATION_STATUSES, GENDERS, TRAINING_STATUSES } from "@/lib/applicants/labels";

/** Strip spaces and a leading +91 / 0 so "98 765 43210" and "+919876543210" match. */
export function normalizeIndianMobile(raw: string): string {
  let value = raw.replace(/[\s-]/g, "");
  if (value.startsWith("+91")) value = value.slice(3);
  else if (value.startsWith("91") && value.length === 12) value = value.slice(2);
  else if (value.startsWith("0") && value.length === 11) value = value.slice(1);
  return value;
}

const MOBILE = /^[6-9][0-9]{9}$/;

const requiredMobile = z
  .string()
  .trim()
  .min(1, "Phone is required")
  .transform(normalizeIndianMobile)
  .refine((value) => MOBILE.test(value), "Enter a 10-digit Indian mobile number");

const optionalMobile = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : normalizeIndianMobile(value)))
  .refine((value) => value === null || MOBILE.test(value), "Enter a 10-digit Indian mobile number");

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Keep this under ${max} characters`)
    .transform((value) => (value === "" ? null : value));

const optionalEmail = z
  .string()
  .trim()
  .toLowerCase()
  .max(200)
  .transform((value) => (value === "" ? null : value))
  .refine(
    (value) => value === null || z.string().email().safeParse(value).success,
    "Enter a valid email",
  );

const pincode = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine((value) => value === null || /^[0-9]{6}$/.test(value), "Pincode must be 6 digits");

const aadhaarLast4 = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine(
    (value) => value === null || /^[0-9]{4}$/.test(value),
    "Enter only the last 4 digits. Never store a full Aadhaar number.",
  );

const dateOfBirth = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine((value) => {
    if (value === null) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date.getFullYear() >= 1940 && date <= today;
  }, "Enter a valid date of birth");

const totalFee = z
  .string()
  .trim()
  .transform((value) => (value === "" ? "0" : value))
  .refine((value) => /^\d+(\.\d{1,2})?$/.test(value), "Enter the fee in rupees")
  .transform((value) => Number(value))
  .refine((value) => value <= 9_999_999.99, "Fee is too large");

const optionalUuid = z
  .string()
  .trim()
  .transform((value) => (value === "" ? null : value))
  .refine(
    (value) => value === null || z.string().uuid().safeParse(value).success,
    "Choose a staff member",
  );

export const applicantSchema = z.object({
  full_name: z.string().trim().min(2, "Name is required").max(120, "Name is too long"),
  phone: requiredMobile,
  alternate_phone: optionalMobile,
  email: optionalEmail,
  date_of_birth: dateOfBirth,
  gender: z
    .string()
    .trim()
    .transform((value) => (value === "" ? null : value))
    .refine(
      (value) => value === null || (GENDERS as readonly string[]).includes(value),
      "Choose a gender",
    ),
  address: optionalText(300),
  city: optionalText(80),
  state: optionalText(80),
  pincode,
  aadhaar_last4: aadhaarLast4,
  application_number: optionalText(40),
  license_category: optionalText(40),
  application_status: z.enum(APPLICATION_STATUSES),
  training_status: z.enum(TRAINING_STATUSES),
  total_fee: totalFee,
  assigned_staff_id: optionalUuid,
  notes: optionalText(2000),
});

export type ApplicantInput = z.infer<typeof applicantSchema>;

export const statusChangeSchema = z.object({
  id: z.string().uuid(),
  application_status: z.enum(APPLICATION_STATUSES),
  training_status: z.enum(TRAINING_STATUSES),
});

export const deleteApplicantSchema = z.object({
  id: z.string().uuid(),
  confirm_name: z.string().trim().min(1, "Type the applicant's name to confirm"),
});

export function fieldErrorsFrom(issues: { path: PropertyKey[]; message: string }[]) {
  const out: Record<string, string> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function readApplicantForm(formData: FormData) {
  return {
    full_name: formData.get("full_name"),
    phone: formData.get("phone"),
    alternate_phone: formData.get("alternate_phone"),
    email: formData.get("email"),
    date_of_birth: formData.get("date_of_birth"),
    gender: formData.get("gender"),
    address: formData.get("address"),
    city: formData.get("city"),
    state: formData.get("state"),
    pincode: formData.get("pincode"),
    aadhaar_last4: formData.get("aadhaar_last4"),
    application_number: formData.get("application_number"),
    license_category: formData.get("license_category"),
    application_status: formData.get("application_status"),
    training_status: formData.get("training_status"),
    total_fee: formData.get("total_fee"),
    assigned_staff_id: formData.get("assigned_staff_id"),
    notes: formData.get("notes"),
  };
}
