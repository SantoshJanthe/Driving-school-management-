import type { Metadata } from "next";
import Link from "next/link";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { SchoolAdminPasswordForm } from "@/components/vendor/school-admin-password-form";
import { requirePlatformOwner } from "@/lib/auth/guards";
import { formatDate, formatINR } from "@/lib/format";
import { listSoftwareSchools } from "@/lib/queries/software-schools";

export const metadata: Metadata = { title: "Schools" };
export const dynamic = "force-dynamic";

const STATUS_LABEL = { pending: "Waiting", verified: "Verified", rejected: "Rejected" } as const;
const METHOD_LABEL: Record<string, string> = {
  upi: "UPI",
  bank: "bank transfer",
  razorpay: "Razorpay",
};

export default async function VendorSchoolsPage() {
  await requirePlatformOwner();
  const schools = await listSoftwareSchools();

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Schools"
        description="Every school on this software, the payment records that unlock the app, and a password you can set for each school admin."
        actions={
          <Link href="/schools/new" className="text-sm underline underline-offset-4">
            New school
          </Link>
        }
      />
      {schools.length === 0 ? (
        <p className="text-sm text-muted-foreground">No schools yet.</p>
      ) : (
        <ul className="grid gap-6">
          {schools.map((school) => (
            <li
              key={school.id}
              className="grid gap-4 rounded-2xl border border-black/10 bg-[#fffcf7] p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-lg font-medium">{school.name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {[school.address, school.contact_phone, school.email]
                      .filter(Boolean)
                      .join(" · ") || "No contact details"}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Opened {formatDate(school.created_at)}
                  </p>
                </div>
                <Badge variant={school.is_active ? "secondary" : "outline"}>
                  {school.is_active ? "Active" : "Inactive"}
                </Badge>
              </div>

              <section className="grid gap-2">
                <h3 className="text-sm font-semibold tracking-wide uppercase">Software access</h3>
                {school.access.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No subscription payment is linked to this school yet.
                  </p>
                ) : (
                  <ul className="grid gap-2">
                    {school.access.map((item) => (
                      <li key={item.id} className="text-sm">
                        <span className="font-medium">{STATUS_LABEL[item.status]}</span>
                        {" · "}
                        {formatINR(item.amount_inr)} by{" "}
                        {METHOD_LABEL[item.payment_method] ?? item.payment_method}
                        {" · "}
                        <span className="font-mono">{item.payment_reference}</span>
                        {" · "}
                        {item.owner_name}, {item.phone}
                        {" · "}
                        {formatDate(item.created_at)}
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <section className="grid gap-3">
                <h3 className="text-sm font-semibold tracking-wide uppercase">School admins</h3>
                {school.admins.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    This school has no admin login yet.
                  </p>
                ) : (
                  school.admins.map((admin) => (
                    <div key={admin.id} className="grid gap-2">
                      <p className="text-sm">
                        {admin.full_name} · {admin.email}
                        {admin.is_active ? "" : " · inactive"}
                      </p>
                      <SchoolAdminPasswordForm
                        userId={admin.id}
                        schoolId={school.id}
                        email={admin.email}
                      />
                    </div>
                  ))
                )}
              </section>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
