/** True when the file path stays inside that applicant’s folder. */
export function pathInsideApplicant(storagePath: string, schoolId: string, applicantId: string) {
  const prefix = `${schoolId}/${applicantId}/`;
  if (!storagePath.startsWith(prefix)) return false;
  if (storagePath.includes("..") || storagePath.includes("\\")) return false;
  const rest = storagePath.slice(prefix.length);
  return rest.length > 0 && !rest.startsWith("/");
}
