export const DOCUMENT_TYPES = [
  "application_form",
  "receipt",
  "sarathi_pdf",
  "id_proof",
  "other",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  application_form: "Application form",
  receipt: "Receipt",
  sarathi_pdf: "SARATHI PDF",
  id_proof: "ID proof",
  other: "Other",
};

export function isDocumentType(value: string): value is DocumentType {
  return (DOCUMENT_TYPES as readonly string[]).includes(value);
}
