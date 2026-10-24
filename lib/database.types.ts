// Hand-maintained mirror of supabase/migrations/0001_init.sql in the shape
// produced by `supabase gen types typescript`. Regenerate with `npm run db:types`
// once a local stack is running; the output is a drop-in replacement.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      schools: {
        Row: {
          id: string;
          name: string;
          address: string | null;
          contact_phone: string | null;
          email: string | null;
          logo_path: string | null;
          settings: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          address?: string | null;
          contact_phone?: string | null;
          email?: string | null;
          logo_path?: string | null;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          address?: string | null;
          contact_phone?: string | null;
          email?: string | null;
          logo_path?: string | null;
          settings?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          school_id: string;
          full_name: string;
          email: string;
          phone: string | null;
          role: Database["public"]["Enums"]["user_role"];
          permissions: Json;
          is_active: boolean;
          last_login_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          school_id: string;
          full_name: string;
          email: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          permissions?: Json;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          full_name?: string;
          email?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["user_role"];
          permissions?: Json;
          is_active?: boolean;
          last_login_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
        ];
      };
      applicants: {
        Row: {
          id: string;
          school_id: string;
          application_number: string | null;
          full_name: string;
          date_of_birth: string | null;
          gender: Database["public"]["Enums"]["gender"] | null;
          phone: string;
          alternate_phone: string | null;
          email: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          pincode: string | null;
          aadhaar_last4: string | null;
          license_category: string | null;
          application_status: Database["public"]["Enums"]["application_status"];
          training_status: Database["public"]["Enums"]["training_status"];
          total_fee: number;
          amount_paid: number;
          balance_due: number;
          assigned_staff_id: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          application_number?: string | null;
          full_name: string;
          date_of_birth?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          phone: string;
          alternate_phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          aadhaar_last4?: string | null;
          license_category?: string | null;
          application_status?: Database["public"]["Enums"]["application_status"];
          training_status?: Database["public"]["Enums"]["training_status"];
          total_fee?: number;
          amount_paid?: number;
          balance_due?: number;
          assigned_staff_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          application_number?: string | null;
          full_name?: string;
          date_of_birth?: string | null;
          gender?: Database["public"]["Enums"]["gender"] | null;
          phone?: string;
          alternate_phone?: string | null;
          email?: string | null;
          address?: string | null;
          city?: string | null;
          state?: string | null;
          pincode?: string | null;
          aadhaar_last4?: string | null;
          license_category?: string | null;
          application_status?: Database["public"]["Enums"]["application_status"];
          training_status?: Database["public"]["Enums"]["training_status"];
          total_fee?: number;
          amount_paid?: number;
          balance_due?: number;
          assigned_staff_id?: string | null;
          notes?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "applicants_school_id_fkey";
            columns: ["school_id"];
            isOneToOne: false;
            referencedRelation: "schools";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applicants_assigned_staff_id_fkey";
            columns: ["assigned_staff_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "applicants_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      training_sessions: {
        Row: {
          id: string;
          school_id: string;
          applicant_id: string;
          session_date: string;
          start_time: string | null;
          end_time: string | null;
          vehicle_type: string | null;
          instructor_id: string | null;
          status: Database["public"]["Enums"]["session_status"];
          remarks: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string;
          applicant_id: string;
          session_date: string;
          start_time?: string | null;
          end_time?: string | null;
          vehicle_type?: string | null;
          instructor_id?: string | null;
          status?: Database["public"]["Enums"]["session_status"];
          remarks?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          applicant_id?: string;
          session_date?: string;
          start_time?: string | null;
          end_time?: string | null;
          vehicle_type?: string | null;
          instructor_id?: string | null;
          status?: Database["public"]["Enums"]["session_status"];
          remarks?: string | null;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "training_sessions_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "training_sessions_instructor_id_fkey";
            columns: ["instructor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          school_id: string;
          applicant_id: string;
          amount: number;
          payment_date: string;
          payment_mode: Database["public"]["Enums"]["payment_mode"];
          receipt_number: string | null;
          remarks: string | null;
          recorded_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string;
          applicant_id: string;
          amount: number;
          payment_date?: string;
          payment_mode: Database["public"]["Enums"]["payment_mode"];
          receipt_number?: string | null;
          remarks?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          applicant_id?: string;
          amount?: number;
          payment_date?: string;
          payment_mode?: Database["public"]["Enums"]["payment_mode"];
          receipt_number?: string | null;
          remarks?: string | null;
          recorded_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
        ];
      };
      documents: {
        Row: {
          id: string;
          school_id: string;
          applicant_id: string;
          document_type: Database["public"]["Enums"]["document_type"];
          file_name: string;
          storage_path: string;
          file_size: number;
          mime_type: string;
          uploaded_by: string | null;
          uploaded_at: string;
          is_archived: boolean;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string;
          applicant_id: string;
          document_type?: Database["public"]["Enums"]["document_type"];
          file_name: string;
          storage_path: string;
          file_size: number;
          mime_type: string;
          uploaded_by?: string | null;
          uploaded_at?: string;
          is_archived?: boolean;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          applicant_id?: string;
          document_type?: Database["public"]["Enums"]["document_type"];
          file_name?: string;
          storage_path?: string;
          file_size?: number;
          mime_type?: string;
          uploaded_by?: string | null;
          uploaded_at?: string;
          is_archived?: boolean;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "documents_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
        ];
      };
      activity_logs: {
        Row: {
          id: number;
          school_id: string;
          user_id: string | null;
          applicant_id: string | null;
          action: Database["public"]["Enums"]["activity_action"];
          entity_type: string;
          entity_id: string | null;
          old_value: Json | null;
          new_value: Json | null;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "activity_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "activity_logs_applicant_id_fkey";
            columns: ["applicant_id"];
            isOneToOne: false;
            referencedRelation: "applicants";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          id: number;
          school_id: string;
          user_id: string | null;
          action: Database["public"]["Enums"]["audit_action"];
          target_user_id: string | null;
          details: Json | null;
          created_at: string;
        };
        Insert: {
          school_id: string;
          user_id: string;
          action: "data_exported";
          target_user_id?: string | null;
          details?: Json | null;
        };
        Update: never;
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      current_profile: {
        Args: Record<string, never>;
        Returns: Database["public"]["Tables"]["profiles"]["Row"] | null;
      };
      dashboard_summary: {
        Args: Record<string, never>;
        Returns: Json;
      };
      log_event: {
        Args: {
          p_action: Database["public"]["Enums"]["activity_action"];
          p_entity_type: string;
          p_entity_id?: string | null;
          p_applicant_id?: string | null;
          p_details?: Json | null;
        };
        Returns: undefined;
      };
      search_applicants: {
        Args: { q: string; result_limit?: number };
        Returns: Database["public"]["Tables"]["applicants"]["Row"][];
      };
    };
    Enums: {
      user_role: "admin" | "staff";
      gender: "male" | "female" | "other";
      application_status:
        | "enquiry"
        | "documents_pending"
        | "application_submitted"
        | "ll_issued"
        | "dl_test_scheduled"
        | "dl_issued"
        | "rejected"
        | "closed";
      training_status: "not_started" | "in_progress" | "completed" | "discontinued";
      session_status: "scheduled" | "completed" | "absent" | "cancelled";
      payment_mode: "cash" | "upi" | "bank" | "card";
      document_type: "application_form" | "receipt" | "sarathi_pdf" | "id_proof" | "other";
      activity_action:
        | "created"
        | "updated"
        | "deleted"
        | "status_changed"
        | "document_uploaded"
        | "document_downloaded"
        | "document_archived"
        | "payment_added"
        | "payment_updated"
        | "payment_deleted"
        | "login";
      audit_action:
        | "staff_created"
        | "staff_updated"
        | "staff_deactivated"
        | "staff_reactivated"
        | "role_changed"
        | "permissions_changed"
        | "school_updated"
        | "data_exported";
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];
