import type { Json } from "@/lib/database.types";

export type CoursePackage = {
  code: string;
  name: string;
  fee: number;
  sessions: number;
  summary: string;
};

/** Default course list used when a school has not saved its own packages yet. */
export const DEFAULT_PACKAGES: CoursePackage[] = [
  {
    code: "lmv",
    name: "Light motor vehicle",
    fee: 8000,
    sessions: 15,
    summary: "Car lessons covering the learner stage and the driving test.",
  },
  {
    code: "mcwg",
    name: "Motorcycle with gear",
    fee: 4500,
    sessions: 10,
    summary: "Two-wheeler lessons for riders who need a geared motorcycle licence.",
  },
  {
    code: "lmv-mcwg",
    name: "Car and motorcycle",
    fee: 11000,
    sessions: 20,
    summary: "Combined car and geared motorcycle training.",
  },
];

/** Sessions promised by the chosen course, otherwise the school default. */
export function sessionTargetFor(
  settings: Json | null | undefined,
  licenseCategory: string | null | undefined,
): number {
  const named = licenseCategory?.trim();
  if (settings && typeof settings === "object" && !Array.isArray(settings)) {
    const record = settings as { packages?: unknown; default_sessions?: unknown };
    if (Array.isArray(record.packages) && named) {
      const match = parsePackages(settings).find((item) => item.name === named);
      if (match && match.sessions > 0) return match.sessions;
    }
    const fallback = Number(record.default_sessions);
    if (Number.isFinite(fallback) && fallback > 0) return Math.round(fallback);
  }
  const preset = DEFAULT_PACKAGES.find((item) => item.name === named);
  if (preset && preset.sessions > 0) return preset.sessions;
  return 12;
}

export function parsePackages(settings: Json | null | undefined): CoursePackage[] {
  if (!settings || typeof settings !== "object" || Array.isArray(settings)) return DEFAULT_PACKAGES;
  const raw = (settings as { packages?: unknown }).packages;
  if (!Array.isArray(raw)) return DEFAULT_PACKAGES;
  const packages = raw.flatMap((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) return [];
    const row = item as Record<string, unknown>;
    const code = typeof row.code === "string" ? row.code : "";
    const name = typeof row.name === "string" ? row.name : "";
    const fee = Number(row.fee);
    const sessions = Number(row.sessions);
    const summary = typeof row.summary === "string" ? row.summary : "";
    if (!code || !name || !Number.isFinite(fee) || fee <= 0) return [];
    return [{ code, name, fee, sessions: Number.isFinite(sessions) ? sessions : 0, summary }];
  });
  return packages.length > 0 ? packages : DEFAULT_PACKAGES;
}
