import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { SubscriptionRequest } from "@/lib/subscription/requests";

export type SchoolAdmin = {
  id: string;
  full_name: string;
  email: string;
  is_active: boolean;
};

export type SoftwareAccessRecord = Pick<
  SubscriptionRequest,
  | "id"
  | "school_name"
  | "owner_name"
  | "phone"
  | "email"
  | "amount_inr"
  | "payment_method"
  | "payment_reference"
  | "status"
  | "created_at"
>;

export type SoftwareSchool = {
  id: string;
  name: string;
  address: string | null;
  contact_phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  admins: SchoolAdmin[];
  access: SoftwareAccessRecord[];
};

const ACCESS_COLUMNS =
  "id, school_name, owner_name, phone, email, amount_inr, payment_method, payment_reference, status, created_at";

function matchesSchool(school: SoftwareSchool, row: SoftwareAccessRecord) {
  const schoolName = school.name.trim().toLowerCase();
  const rowName = row.school_name.trim().toLowerCase();
  if (schoolName && rowName && schoolName === rowName) return true;
  if (school.contact_phone && row.phone && school.contact_phone === row.phone) return true;
  const schoolEmail = school.email?.trim().toLowerCase();
  const rowEmail = row.email?.trim().toLowerCase();
  if (schoolEmail && rowEmail && schoolEmail === rowEmail) return true;
  return school.admins.some((admin) => admin.email.trim().toLowerCase() === rowEmail);
}

export async function listSoftwareSchools(): Promise<SoftwareSchool[]> {
  const admin = createAdminClient();
  const [{ data: schools, error: schoolError }, { data: admins }, { data: requests }] =
    await Promise.all([
      admin
        .from("schools")
        .select("id, name, address, contact_phone, email, is_active, created_at")
        .order("name"),
      admin
        .from("profiles")
        .select("id, school_id, full_name, email, is_active, role")
        .eq("role", "admin")
        .order("full_name"),
      admin
        .from("subscription_requests")
        .select(ACCESS_COLUMNS)
        .order("created_at", { ascending: false })
        .limit(200),
    ]);
  if (schoolError || !schools) return [];

  return schools.map((school) => {
    const row: SoftwareSchool = {
      ...school,
      admins: (admins ?? [])
        .filter((person) => person.school_id === school.id)
        .map(({ id, full_name, email, is_active }) => ({ id, full_name, email, is_active })),
      access: [],
    };
    row.access = ((requests ?? []) as SoftwareAccessRecord[]).filter((item) =>
      matchesSchool(row, item),
    );
    return row;
  });
}
