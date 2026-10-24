import { cache } from "react";

import {
  isApplicationStatus,
  isTrainingStatus,
  type ApplicationStatus,
  type Gender,
  type TrainingStatus,
} from "@/lib/applicants/labels";
import { createClient } from "@/lib/supabase/server";

export const PAGE_SIZE = 25;

export type StaffOption = { id: string; full_name: string };

export type ApplicantListItem = {
  id: string;
  full_name: string;
  application_number: string | null;
  phone: string;
  application_status: ApplicationStatus;
  training_status: TrainingStatus;
  balance_due: number;
  total_fee: number;
  amount_paid: number;
};

export type ApplicantDetail = ApplicantListItem & {
  alternate_phone: string | null;
  email: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  aadhaar_last4: string | null;
  license_category: string | null;
  notes: string | null;
  assigned_staff_id: string | null;
  assigned_staff_name: string | null;
  created_by_name: string | null;
  created_at: string;
  updated_at: string;
};

export type ApplicantActivity = {
  id: number;
  action: string;
  entity_type: string;
  created_at: string;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  user_name: string | null;
};

function num(value: unknown): number {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export async function listStaffOptions(): Promise<StaffOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listApplicants(params: {
  q?: string;
  status?: string;
  training?: string;
  staff?: string;
  page: number;
}): Promise<{ rows: ApplicantListItem[]; total: number }> {
  const supabase = await createClient();
  const status = isApplicationStatus(params.status) ? params.status : undefined;
  const training = isTrainingStatus(params.training) ? params.training : undefined;
  const staff = params.staff && params.staff !== "all" ? params.staff : undefined;
  const page = Number.isFinite(params.page) && params.page > 0 ? params.page : 1;
  const q = params.q?.trim() ?? "";

  if (q) {
    const { data, error } = await supabase.rpc("search_applicants", { q, result_limit: 100 });
    if (error) throw new Error(error.message);
    const filtered = (data ?? []).filter((row) => {
      if (status && row.application_status !== status) return false;
      if (training && row.training_status !== training) return false;
      if (staff && row.assigned_staff_id !== staff) return false;
      return true;
    });
    const start = (page - 1) * PAGE_SIZE;
    return {
      total: filtered.length,
      rows: filtered.slice(start, start + PAGE_SIZE).map(toListItem),
    };
  }

  let query = supabase
    .from("applicants")
    .select(
      "id, full_name, application_number, phone, application_status, training_status, balance_due, total_fee, amount_paid",
      { count: "exact" },
    )
    .order("updated_at", { ascending: false });
  if (status) query = query.eq("application_status", status);
  if (training) query = query.eq("training_status", training);
  if (staff) query = query.eq("assigned_staff_id", staff);

  const start = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.range(start, start + PAGE_SIZE - 1);
  if (error) throw new Error(error.message);
  return { rows: (data ?? []).map(toListItem), total: count ?? 0 };
}

function toListItem(row: {
  id: string;
  full_name: string;
  application_number: string | null;
  phone: string;
  application_status: ApplicationStatus;
  training_status: TrainingStatus;
  balance_due: number;
  total_fee: number;
  amount_paid: number;
}): ApplicantListItem {
  return {
    id: row.id,
    full_name: row.full_name,
    application_number: row.application_number,
    phone: row.phone,
    application_status: row.application_status,
    training_status: row.training_status,
    balance_due: num(row.balance_due),
    total_fee: num(row.total_fee),
    amount_paid: num(row.amount_paid),
  };
}

export const getApplicant = cache(async (id: string): Promise<ApplicantDetail | null> => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applicants")
    .select(
      `id, full_name, application_number, phone, alternate_phone, email, date_of_birth, gender,
       address, city, state, pincode, aadhaar_last4, license_category, application_status,
       training_status, total_fee, amount_paid, balance_due, notes, assigned_staff_id,
       created_at, updated_at,
       assigned:profiles!applicants_assigned_staff_id_fkey(full_name),
       creator:profiles!applicants_created_by_fkey(full_name)`,
    )
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) return null;

  const assigned = one(data.assigned);
  const creator = one(data.creator);
  return {
    ...toListItem(data),
    alternate_phone: data.alternate_phone,
    email: data.email,
    date_of_birth: data.date_of_birth,
    gender: data.gender,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    aadhaar_last4: data.aadhaar_last4,
    license_category: data.license_category,
    notes: data.notes,
    assigned_staff_id: data.assigned_staff_id,
    assigned_staff_name: assigned?.full_name ?? null,
    created_by_name: creator?.full_name ?? null,
    created_at: data.created_at,
    updated_at: data.updated_at,
  };
});

export async function listApplicantActivity(applicantId: string): Promise<ApplicantActivity[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activity_logs")
    .select(
      "id, action, entity_type, created_at, old_value, new_value, user:profiles!activity_logs_user_id_fkey(full_name)",
    )
    .eq("applicant_id", applicantId)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    entity_type: row.entity_type,
    created_at: row.created_at,
    old_value: asRecord(row.old_value),
    new_value: asRecord(row.new_value),
    user_name: one(row.user)?.full_name ?? null,
  }));
}
