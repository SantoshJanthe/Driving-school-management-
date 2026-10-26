import { parsePermissions, type Permissions, type Role } from "@/lib/auth/permissions";
import type { Json } from "@/lib/database.types";
import { createClient } from "@/lib/supabase/server";

export type StaffMember = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  permissions: Permissions;
  is_active: boolean;
  last_login_at: string | null;
};

export async function listStaff(): Promise<StaffMember[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, permissions, is_active, last_login_at")
    .order("role")
    .order("full_name");
  if (error) throw new Error(error.message);
  return (data ?? []).map(toMember);
}

export async function getStaffMember(id: string): Promise<StaffMember | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, phone, role, permissions, is_active, last_login_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toMember(data) : null;
}

function toMember(row: {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: Role;
  permissions: Json;
  is_active: boolean;
  last_login_at: string | null;
}): StaffMember {
  return {
    id: row.id,
    full_name: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    permissions: parsePermissions(row.permissions),
    is_active: row.is_active,
    last_login_at: row.last_login_at,
  };
}
