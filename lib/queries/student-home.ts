import { APPLICATION_STATUS_LABELS, type ApplicationStatus } from "@/lib/applicants/labels";
import type { DocumentType } from "@/lib/documents/constants";
import { createClient } from "@/lib/supabase/server";
import type { AttendanceMark, SessionStatus } from "@/lib/training/constants";

export type StudentSession = {
  id: string;
  session_date: string;
  start_time: string | null;
  end_time: string | null;
  vehicle_type: string | null;
  status: SessionStatus;
  attendance: AttendanceMark | null;
  remarks: string | null;
  instructor_name: string | null;
};

export type StudentDocument = {
  id: string;
  file_name: string;
  document_type: DocumentType;
  uploaded_at: string;
};

export type StudentHome = {
  full_name: string;
  license_category: string | null;
  application_status: string;
  total_fee: number;
  amount_paid: number;
  balance_due: number;
  sessions: StudentSession[];
  documents: StudentDocument[];
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/** The signed-in student's own course, sessions, balance, and documents. */
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
  ] = await Promise.all([
    supabase
      .from("applicants")
      .select(
        "full_name, license_category, application_status, total_fee, amount_paid, balance_due",
      )
      .eq("id", link.applicant_id)
      .maybeSingle(),
    supabase
      .from("training_sessions")
      .select(
          "id, session_date, start_time, end_time, vehicle_type, status, attendance, remarks, instructor:profiles!training_sessions_instructor_id_fkey(full_name)",
      )
      .eq("applicant_id", link.applicant_id)
      .order("session_date", { ascending: false })
      .limit(20),
    supabase
      .from("documents")
      .select("id, file_name, document_type, uploaded_at")
      .eq("applicant_id", link.applicant_id)
      .eq("is_archived", false)
      .order("uploaded_at", { ascending: false }),
  ]);
  if (applicantError) throw new Error(applicantError.message);
  if (sessionError) throw new Error(sessionError.message);
  if (documentError) throw new Error(documentError.message);
  if (!applicant) return null;

  const status = applicant.application_status as ApplicationStatus;

  return {
    full_name: applicant.full_name,
    license_category: applicant.license_category,
    application_status: APPLICATION_STATUS_LABELS[status] ?? status,
    total_fee: Number(applicant.total_fee),
    amount_paid: Number(applicant.amount_paid),
    balance_due: Number(applicant.balance_due),
    sessions: (sessions ?? []).map((row) => ({
      id: row.id,
      session_date: row.session_date,
      start_time: row.start_time,
      end_time: row.end_time,
      vehicle_type: row.vehicle_type,
      status: row.status,
      attendance: row.attendance,
      remarks: row.remarks,
      instructor_name: one(row.instructor)?.full_name ?? null,
    })),
    documents: documents ?? [],
  };
}
