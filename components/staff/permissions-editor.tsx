import { PERMISSION_KEYS, PERMISSION_LABELS, type Permissions } from "@/lib/auth/permissions";

export function PermissionsEditor({
  permissions,
  disabled,
}: {
  permissions: Permissions;
  disabled?: boolean;
}) {
  return (
    <fieldset className="grid gap-2" disabled={disabled}>
      <legend className="mb-2 text-sm font-medium">Permissions</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {PERMISSION_KEYS.map((key) => (
          <label
            key={key}
            className="flex min-h-11 items-center gap-3 rounded-xl border border-black/10 bg-white/70 px-3 text-sm"
          >
            <input
              type="checkbox"
              name={`perm_${key}`}
              defaultChecked={permissions[key]}
              className="size-4"
            />
            {PERMISSION_LABELS[key]}
          </label>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Staff still cannot delete applicants, edit payments, manage staff, or open audit logs.
      </p>
    </fieldset>
  );
}
