import type { Metadata } from "next";
import Link from "next/link";

import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { SchoolLogo } from "@/components/layout/school-logo";
import { Button } from "@/components/ui/button";
import { parsePackages, type CoursePackage } from "@/lib/school/packages";
import { createClient } from "@/lib/supabase/server";
import { formatINR } from "@/lib/format";

export const metadata: Metadata = {
  title: "Learn to drive",
  description: "Courses, fees, and an enquiry form for the driving school.",
};

type PublicSchool = {
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  packages: CoursePackage[];
  hasLogo: boolean;
};

async function loadSchool(): Promise<PublicSchool> {
  const fallback: PublicSchool = {
    name: "Driving school",
    address: null,
    phone: null,
    email: null,
    packages: parsePackages(null),
    hasLogo: false,
  };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("public_school");
    if (error || !data || typeof data !== "object" || Array.isArray(data)) return fallback;
    const row = data as Record<string, unknown>;
    return {
      name: typeof row.name === "string" && row.name ? row.name : fallback.name,
      address: typeof row.address === "string" ? row.address : null,
      phone: typeof row.phone === "string" ? row.phone : null,
      email: typeof row.email === "string" ? row.email : null,
      packages: parsePackages({ packages: row.packages as never }),
      hasLogo: row.has_logo === true,
    };
  } catch {
    return fallback;
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const school = await loadSchool();
  const { course } = await searchParams;

  return (
    <div className="page-enter mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-16 px-4 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {school.hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/api/branding/logo" alt="" className="size-10 rounded-xl object-cover" />
          ) : (
            <SchoolLogo className="size-10 rounded-xl" />
          )}
          <div>
            <p className="text-sm font-medium tracking-tight">{school.name}</p>
            {school.phone ? (
              <a className="text-xs text-muted-foreground" href={`tel:${school.phone}`}>
                {school.phone}
              </a>
            ) : null}
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a className="hidden underline-offset-4 hover:underline sm:inline" href="#courses">
            Courses
          </a>
          <a className="hidden underline-offset-4 hover:underline sm:inline" href="#enquire">
            Enquire
          </a>
          <Button variant="outline" asChild className="h-11">
            <Link href="/login">Staff sign in</Link>
          </Button>
        </nav>
      </header>

      <section className="grid gap-4">
        <h1 className="max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
          Lessons for the licence you actually need.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Pick a course, send an enquiry, and the office will call you to fix a start date.
          Training, fees, and documents stay on the school’s own records.
        </p>
      </section>

      <section id="courses" className="grid gap-4" aria-labelledby="courses-heading">
        <h2 id="courses-heading" className="text-2xl font-medium tracking-tight">
          Courses and fees
        </h2>
        <ul className="grid gap-4 md:grid-cols-3">
          {school.packages.map((item) => (
            <li
              key={item.code}
              className="flex flex-col gap-3 rounded-2xl border border-black/10 bg-[#fffcf7] p-5 shadow-[0_18px_50px_rgba(26,25,22,0.05)]"
            >
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {item.code}
              </p>
              <h3 className="text-lg font-medium">{item.name}</h3>
              <p className="text-sm text-muted-foreground">{item.summary}</p>
              <p className="text-2xl font-medium">{formatINR(item.fee)}</p>
              <p className="text-xs text-muted-foreground">{item.sessions} sessions included</p>
              <Button asChild variant="outline" className="mt-auto h-11">
                <Link href={`/?course=${item.code}#enquire`}>Enquire about this course</Link>
              </Button>
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 md:grid-cols-3" aria-labelledby="why-heading">
        <h2 id="why-heading" className="sr-only">
          Why train here
        </h2>
        {[
          [
            "Your own instructor",
            "Sessions are booked with a named instructor from the school, not a random roster.",
          ],
          [
            "A record of every lesson",
            "Attendance, payments, and documents stay on your application.",
          ],
          [
            "One office number",
            "Questions go to the branch, and an enquiry is the same record the staff open later.",
          ],
        ].map(([title, body]) => (
          <div key={title} className="grid gap-2">
            <h3 className="text-base font-medium">{title}</h3>
            <p className="text-sm text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4" aria-labelledby="how-heading">
        <h2 id="how-heading" className="text-2xl font-medium tracking-tight">
          How it works
        </h2>
        <ol className="grid gap-4 md:grid-cols-3">
          {[
            ["1. Enquire", "Tell us the course and a mobile number."],
            ["2. Train", "The office schedules sessions and tracks them against your fee."],
            ["3. Test", "Staff update the licence status as you move through the process."],
          ].map(([title, body]) => (
            <li key={title} className="rounded-2xl border border-black/10 bg-white/60 p-5">
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-3" aria-labelledby="stories-heading">
        <h2 id="stories-heading" className="text-2xl font-medium tracking-tight">
          Sample notes
        </h2>
        <p className="text-sm text-muted-foreground">
          Placeholder quotes until the school adds real ones.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <blockquote className="rounded-2xl border border-dashed border-black/15 p-5 text-sm">
            “Morning slots made it possible to finish before work.” — Sample learner
          </blockquote>
          <blockquote className="rounded-2xl border border-dashed border-black/15 p-5 text-sm">
            “I could see which classes were still left.” — Sample learner
          </blockquote>
        </div>
      </section>

      <section className="grid gap-8 md:grid-cols-2" aria-labelledby="contact-heading">
        <div className="grid gap-3">
          <h2 id="contact-heading" className="text-2xl font-medium tracking-tight">
            Branch
          </h2>
          <p className="text-sm">{school.address ?? "Address not set yet."}</p>
          {school.phone ? (
            <a className="text-sm underline-offset-4 hover:underline" href={`tel:${school.phone}`}>
              {school.phone}
            </a>
          ) : null}
          {school.email ? (
            <a
              className="text-sm underline-offset-4 hover:underline"
              href={`mailto:${school.email}`}
            >
              {school.email}
            </a>
          ) : null}
        </div>
        <div className="rounded-2xl border border-black/10 bg-[#fffcf7] p-5 shadow-[0_18px_50px_rgba(26,25,22,0.05)]">
          <h2 className="mb-4 text-lg font-medium">Send an enquiry</h2>
          <EnquiryForm packages={school.packages} selected={course} />
        </div>
      </section>
    </div>
  );
}
