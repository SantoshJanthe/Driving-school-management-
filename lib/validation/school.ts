import { z } from "zod";

const course = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9-]{2,32}$/, "Use a short code such as lmv"),
  name: z.string().trim().min(2, "Enter the course name").max(80, "Course name is too long"),
  fee: z.coerce.number().positive("Enter a fee above zero").max(9_999_999.99, "Fee is too large"),
  sessions: z.coerce
    .number()
    .int("Sessions must be a whole number")
    .min(0, "Sessions cannot be negative")
    .max(200, "Sessions is too large"),
  summary: z.string().trim().max(200, "Keep the summary under 200 characters"),
});

export const schoolSettingsSchema = z.object({
  name: z.string().trim().min(2, "Enter the school name").max(120, "Name is too long"),
  address: z.string().trim().max(300, "Address is too long"),
  contact_phone: z
    .string()
    .trim()
    .max(20, "Phone is too long")
    .refine((value) => value === "" || /^[0-9+\-()\s]{6,20}$/.test(value), "Enter a phone number"),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .max(200)
    .refine(
      (value) => value === "" || z.string().email().safeParse(value).success,
      "Enter a valid email",
    ),
  packages: z
    .array(course)
    .min(1, "Add at least one course")
    .max(8, "Keep the list to 8 courses")
    .superRefine((packages, ctx) => {
      const seen = new Set<string>();
      packages.forEach((item, index) => {
        if (seen.has(item.code)) {
          ctx.addIssue({
            code: "custom",
            path: [index, "code"],
            message: "Course codes must be unique",
          });
        }
        seen.add(item.code);
      });
    }),
});

export type SchoolSettingsInput = z.infer<typeof schoolSettingsSchema>;

export function readSchoolForm(formData: FormData) {
  const packages = [];
  for (let index = 0; index < 8; index += 1) {
    const code = formData.get(`package_code_${index}`);
    if (code === null) continue;
    packages.push({
      code,
      name: formData.get(`package_name_${index}`),
      fee: formData.get(`package_fee_${index}`),
      sessions: formData.get(`package_sessions_${index}`),
      summary: formData.get(`package_summary_${index}`),
    });
  }
  return {
    name: formData.get("name"),
    address: formData.get("address"),
    contact_phone: formData.get("contact_phone"),
    email: formData.get("email"),
    packages,
  };
}
