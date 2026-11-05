import {
  APPLICATION_STATUS_LABELS,
  GENDER_LABELS,
  TRAINING_STATUS_LABELS,
  type ApplicationStatus,
  type Gender,
  type TrainingStatus,
} from "@/lib/applicants/labels";
import { DOCUMENT_TYPES, type DocumentType } from "@/lib/documents/constants";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceMark, SessionStatus } from "@/lib/training/constants";
import { kolkataDate } from "@/lib/training/constants";

export type StudentSession = {
  id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  vehicle_type: string | null;
  status: SessionStatus;
  attendance: AttendanceMark | null;
  instructor_name: string | null;
  remarks: string | null;
};

export type StudentDocument = {
  id: string;
  file_name: string;
  document_type: DocumentType;
  uploaded_at: string;
};

export type StudentPayment = {
  id: string;
  amount: number;
  payment_date: string;
  payment_mode: string;
  receipt_number: string | null;
  remarks: string | null;
};

export type StudentHome = {
  applicant_id: string;
  full_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  date_of_birth: string | null;
  gender: string | null;
  assigned_staff: string | null;
  application_number: string | null;
  license_category: string | null;
  application_status: string;
  training_status: string;
  total_fee: number;
  amount_paid: number;
  balance_due: number;
  ll_number: string | null;
  ll_issued_on: string | null;
  dl_test_date: string | null;
  dl_result: string | null;
  missing_documents: DocumentType[];
  upcoming: StudentSession[];
  past: StudentSession[];
  payments: StudentPayment[];
  documents: StudentDocument[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function num(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

function mapSession(row: {
  id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  vehicle_type: string | null;
  status: SessionStatus;
  attendance: AttendanceMark | null;
  remarks: string | null;
  instructor: { full_name: string } | { full_name: string }[] | null;
}): StudentSession {
  return {
    id: row.id,
    session_date: row.session_date,
    start_time: row.start_time,
    end_time: row.end_time,
    vehicle_type: row.vehicle_type,
    status: row.status,
    attendance: row.attendance,
    instructor_name: one(row.instructor)?.full_name ?? null,
    remarks: row.remarks,
  };
}

/** The signed-in student's own record. RLS already hides every other learner. */
export async function getStudentHome(): Promise<StudentHome | null> {
  const supabase = await createClient();
  const { data: link, error } = await supabase
    .from("student_accounts")
    .select("applicant_id")
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!link) return null;

  const [
    { data: applicant, error: applicantError },
    { data: sessions, error: sessionError },
    { data: documents, error: documentError },
    { data: payments, error: paymentError },
  ] = await Promise.all([
    supabase
      .from("applicants")
      .select(
        "full_name, phone, email, address, city, state, pincode, date_of_birth, gender, application_number, license_category, application_status, training_status, total_fee, amount_paid, balance_due, ll_number, ll_issued_on, dl_test_date, dl_result, assigned_staff:profiles!applicants_assigned_staff_id_fkey(full_name)",
      )
      .eq("id", link.applicant_id)
      .maybeSingle(),
    supabase
      .from("training_sessions")
      .select(
        "id, session_date, start_time, end_time, vehicle_type, status, attendance, remarks, instructor:profiles!training_sessions_instructor_id_fkey(full_name)",
      )
      .eq("applicant_id", link.applicant_id)
      .neq("status", "cancelled")
      .order("session_date", { ascending: true })
      .order("start_time", { ascending: true }),
    supabase
      .from("documents")
      .select("id, file_name, document_type, uploaded_at")
      .eq("applicant_id", link.applicant_id)
      .eq("is_archived", false)
      .order("uploaded_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, amount, payment_date, payment_mode, receipt_number, remarks")
      .eq("applicant_id", link.applicant_id)
      .order("payment_date", { ascending: false }),
  ]);
  if (applicantError) throw new Error(applicantError.message);
  if (sessionError) throw new Error(sessionError.message);
  if (documentError) throw new Error(documentError.message);
  if (paymentError) throw new Error(paymentError.message);
  if (!applicant) return null;

  const today = kolkataDate();
  const mapped = (sessions ?? []).map(mapSession);
  const uploaded = new Set((documents ?? []).map((row) => row.document_type));
  const applicationStatus = applicant.application_status as ApplicationStatus;
  const trainingStatus = applicant.training_status as TrainingStatus;
  const gender = applicant.gender as Gender | null;
  const address = [applicant.address, applicant.city, applicant.state, applicant.pincode]
    .filter(Boolean)
    .join(", ");
  const assigned = one(
    applicant.assigned_staff as { full_name: string } | { full_name: string }[] | null,
  );

  return {
    applicant_id: link.applicant_id,
    full_name: applicant.full_name,
    phone: applicant.phone,
    email: applicant.email,
    address: address || null,
    date_of_birth: applicant.date_of_birth,
    gender: gender ? GENDER_LABELS[gender] : null,
    assigned_staff: assigned?.full_name ?? null,
    application_number: applicant.application_number,
    license_category: applicant.license_category,
    application_status: APPLICATION_STATUS_LABELS[applicationStatus] ?? applicationStatus,
    training_status: TRAINING_STATUS_LABELS[trainingStatus] ?? trainingStatus,
    total_fee: num(applicant.total_fee),
    amount_paid: num(applicant.amount_paid),
    balance_due: num(applicant.balance_due),
    ll_number: applicant.ll_number,
    ll_issued_on: applicant.ll_issued_on,
    dl_test_date: applicant.dl_test_date,
    dl_result: applicant.dl_result,
    missing_documents: DOCUMENT_TYPES.filter((type) => type !== "other" && !uploaded.has(type)),
    upcoming: mapped.filter((session) => session.session_date >= today),
    past: mapped.filter((session) => session.session_date < today).reverse(),
    payments: (payments ?? []).map((row) => ({ ...row, amount: num(row.amount) })),
    documents: documents ?? [],
  };
}
