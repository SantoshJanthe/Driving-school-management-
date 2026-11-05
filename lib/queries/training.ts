import { sessionTargetFor } from "@/lib/school/packages";
import { createClient } from "@/lib/supabase/server";
import type { SessionStatus } from "@/lib/training/constants";

export type SessionRow = {
  id: string;
  applicant_id: string;
  applicant_name: string | null;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  vehicle_type: string | null;
  instructor_id: string | null;
  instructor_name: string | null;
  status: SessionStatus;
  remarks: string | null;
  vehicle_id: string | null;
  vehicle_name: string | null;
};

export type StaffOption = { id: string; full_name: string };
export type ApplicantOption = { id: string; full_name: string; application_number: string | null };

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function mapRow(row: {
  id: string;
  applicant_id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  vehicle_type: string | null;
  vehicle_id?: string | null;
  instructor_id: string | null;
  status: SessionStatus;
  remarks: string | null;
  applicant: { full_name: string } | { full_name: string }[] | null;
  instructor: { full_name: string } | { full_name: string }[] | null;
  vehicle?: { name: string } | { name: string }[] | null;
}): SessionRow {
  return {
    id: row.id,
    applicant_id: row.applicant_id,
    applicant_name: one(row.applicant)?.full_name ?? null,
    session_date: row.session_date,
    start_time: row.start_time,
    end_time: row.end_time,
    vehicle_type: row.vehicle_type,
    instructor_id: row.instructor_id,
    instructor_name: one(row.instructor)?.full_name ?? null,
    status: row.status,
    remarks: row.remarks,
    vehicle_id: row.vehicle_id ?? null,
    vehicle_name: one(row.vehicle)?.name ?? null,
  };
}

const SESSION_SELECT =
  "id, applicant_id, session_date, start_time, end_time, vehicle_type, vehicle_id, instructor_id, status, remarks, applicant:applicants(full_name), instructor:profiles!training_sessions_instructor_id_fkey(full_name), vehicle:vehicles(name)";

export type VehicleOption = { id: string; name: string; vehicle_type: string | null };

export async function listVehicles(): Promise<VehicleOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vehicles")
    .select("id, name, vehicle_type")
    .eq("is_active", true)
    .order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listSessionsBetween(from: string, to: string): Promise<SessionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_sessions")
    .select(SESSION_SELECT)
    .gte("session_date", from)
    .lte("session_date", to)
    .neq("status", "cancelled")
    .order("session_date")
    .order("start_time", { ascending: true, nullsFirst: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as never));
}

export async function listApplicantSessions(applicantId: string): Promise<SessionRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_sessions")
    .select(SESSION_SELECT)
    .eq("applicant_id", applicantId)
    .order("session_date", { ascending: false })
    .order("start_time", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row));
}

export async function listDaySessions(filters: {
  date: string;
  instructorId?: string;
  vehicle?: string;
}): Promise<SessionRow[]> {
  const supabase = await createClient();
  let query = supabase
    .from("training_sessions")
    .select(SESSION_SELECT)
    .eq("session_date", filters.date)
    .order("start_time", { ascending: true, nullsFirst: false });
  if (filters.instructorId) query = query.eq("instructor_id", filters.instructorId);
  if (filters.vehicle) query = query.eq("vehicle_type", filters.vehicle);
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row));
}

export async function listTrainingStaff(): Promise<StaffOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name")
    .eq("is_active", true)
    .order("full_name");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function listTrainingApplicants(): Promise<ApplicantOption[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applicants")
    .select("id, full_name, application_number")
    .order("full_name")
    .limit(200);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function sessionTarget(
  schoolId: string,
  licenseCategory?: string | null,
): Promise<number> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("schools")
    .select("settings")
    .eq("id", schoolId)
    .maybeSingle();
  return sessionTargetFor(data?.settings, licenseCategory);
}
