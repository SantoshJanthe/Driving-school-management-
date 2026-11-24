import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { MfaPanel } from "@/components/settings/mfa-panel";
import { PasswordForm } from "@/components/settings/password-form";
import { SchoolForm } from "@/components/settings/school-form";
import { CONSOLE_COOKIE } from "@/lib/auth/console";
import { requireProfile } from "@/lib/auth/guards";
import { isAdmin, isInstructorOnly } from "@/lib/auth/permissions";
import { formatINR } from "@/lib/format";
import { DEFAULT_PACKAGES } from "@/lib/school/packages";
import { getOwnSchool } from "@/lib/queries/school";
import { isPlatformOwner } from "@/lib/subscription/config";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const profile = await requireProfile();
  const school = await getOwnSchool();
  const {
    data: { user },
  } = await (await createClient()).auth.getUser();
  const softwareConsole =
    (await cookies()).get(CONSOLE_COOKIE)?.value === "software" && isPlatformOwner(user?.email);
  const admin = isAdmin(profile);
  const limited = profile.role === "student" || isInstructorOnly(profile);
  const packages = school?.packages ?? DEFAULT_PACKAGES;

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Settings"
        description={
          softwareConsole
            ? "Software admin password."
            : limited
              ? "Change your own password."
              : "Branch contact and your own password."
        }
      />
      {softwareConsole ? (
        <p className="rounded-2xl border border-black/10 bg-[#fffcf7] p-4 text-sm">
          You can open every school and verify software subscription payments.{" "}
          <Link href="/vendor/schools" className="underline underline-offset-4">
            Open schools
          </Link>
          {" · "}
          <Link href="/vendor/subscriptions" className="underline underline-offset-4">
            Open subscription payments
          </Link>
        </p>
      ) : null}
      <PasswordForm />
      {softwareConsole || !admin ? null : <MfaPanel />}
      {softwareConsole || limited ? null : school ? (
        admin ? (
          <>
            <SchoolForm
              name={school.name}
              address={school.address ?? ""}
              phone={school.contact_phone ?? ""}
              email={school.email ?? ""}
              hasLogo={Boolean(school.logo_path)}
              logoVersion={school.updated_at}
            />
            <p className="text-sm text-muted-foreground">
              Course names, fees, and session counts are edited on the{" "}
              <Link href="/courses" className="underline underline-offset-4">
                Courses
              </Link>{" "}
              page.
            </p>
          </>
        ) : (
          <div className="grid gap-6">
            <section className="grid gap-2">
              <h2 className="text-sm font-semibold tracking-wide uppercase">Branch</h2>
              <p className="font-medium">{school.name}</p>
              <p className="text-sm text-muted-foreground">
                {school.address ?? "Address not set."}
              </p>
              <p className="text-sm text-muted-foreground">
                {school.contact_phone ?? "Phone not set."}
              </p>
              <p className="text-sm text-muted-foreground">{school.email ?? "Email not set."}</p>
              <p className="text-sm text-muted-foreground">An admin can change these details.</p>
            </section>
            <section className="grid gap-3">
              <h2 className="text-sm font-semibold tracking-wide uppercase">Courses and fees</h2>
              <ul className="grid gap-3 md:grid-cols-3">
                {packages.map((item) => (
                  <li
                    key={item.code}
                    className="rounded-2xl border border-black/10 bg-[#fffcf7] p-4"
                  >
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{item.summary}</p>
                    <p className="mt-3 text-lg">{formatINR(item.fee)}</p>
                    <p className="text-xs text-muted-foreground">{item.sessions} sessions</p>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">School details are not available.</p>
      )}
    </div>
  );
}
