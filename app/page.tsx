import type { Metadata } from "next";
import Link from "next/link";

import { EnquiryForm } from "@/components/marketing/enquiry-form";
import { TopographyBackground } from "@/components/marketing/topography-background";
import { SchoolLogo } from "@/components/layout/school-logo";
import { Button } from "@/components/ui/button";
import { env } from "@/lib/env";
import { parsePackages, type CoursePackage } from "@/lib/school/packages";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: { absolute: env.appName },
  description:
    "Software for motor driving schools: applicants, training, fees, documents, and staff.",
};

type PublicSchool = {
  id: string | null;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  packages: CoursePackage[];
  hasLogo: boolean;
};

type PublicChoice = { id: string; name: string };

const fallbackSchool: PublicSchool = {
  id: null,
  name: "Driving school",
  address: null,
  phone: null,
  email: null,
  packages: parsePackages(null),
  hasLogo: false,
};

async function loadChoices(): Promise<PublicChoice[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("public_schools");
    if (error || !Array.isArray(data)) return [];
    return data.flatMap((row) => {
      if (!row || typeof row !== "object" || Array.isArray(row)) return [];
      const item = row as Record<string, unknown>;
      if (typeof item.id !== "string" || typeof item.name !== "string" || !item.name) return [];
      return [{ id: item.id, name: item.name }];
    });
  } catch {
    return [];
  }
}

async function loadSchool(schoolId: string | null): Promise<PublicSchool> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("public_school", { p_school: schoolId });
    if (error || !data || typeof data !== "object" || Array.isArray(data)) return fallbackSchool;
    const row = data as Record<string, unknown>;
    return {
      id: schoolId,
      name: typeof row.name === "string" && row.name ? row.name : fallbackSchool.name,
      address: typeof row.address === "string" ? row.address : null,
      phone: typeof row.phone === "string" ? row.phone : null,
      email: typeof row.email === "string" ? row.email : null,
      packages: parsePackages({ packages: row.packages as never }),
      hasLogo: row.has_logo === true,
    };
  } catch {
    return fallbackSchool;
  }
}

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; school?: string }>;
}) {
  const { course, school: requestedSchool } = await searchParams;
  const choices = await loadChoices();
  const selected = choices.find((item) => item.id === requestedSchool) ?? choices[0] ?? null;
  const school = await loadSchool(selected?.id ?? null);

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <TopographyBackground />
      <div className="page-enter relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-16 px-4 py-8 md:px-8 md:py-12">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {school.hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected ? `/api/branding/logo?school=${selected.id}` : "/api/branding/logo"}
              alt=""
              className="size-10 rounded-xl object-cover"
            />
          ) : (
            <SchoolLogo className="size-10 rounded-xl" />
          )}
          <div>
            <p className="text-sm font-medium tracking-tight">{env.appName}</p>
            <p className="text-xs text-muted-foreground">For motor driving schools</p>
          </div>
        </div>
        <nav className="flex items-center gap-4 text-sm">
          <a className="hidden underline-offset-4 hover:underline sm:inline" href="#office">
            The office
          </a>
          <a className="hidden underline-offset-4 hover:underline sm:inline" href="#enquire">
            Enquire
          </a>
          <Button variant="outline" asChild className="h-11">
            <Link href="/login">Staff sign in</Link>
          </Button>
        </nav>
      </header>

      {choices.length > 1 ? (
        <form action="/" className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="school-picker" className="text-sm font-medium">
              School
            </label>
            <select
              id="school-picker"
              name="school"
              defaultValue={selected?.id}
              className="h-11 min-w-64 rounded-lg border border-black/10 bg-[#fffcf7] px-2.5 text-sm"
            >
              {choices.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="h-11 rounded-lg border border-black/10 bg-white px-4 text-sm font-medium"
          >
            Show this school
          </button>
        </form>
      ) : null}

      <section className="grid gap-4 rounded-[2rem] border border-black/10 bg-[#fffcf7]/80 p-6 shadow-[0_18px_50px_rgba(26,25,22,0.05)] backdrop-blur-[2px] md:p-10">
        <p className="text-xs font-medium tracking-[0.18em] text-[#8a7355] uppercase">
          {env.appName}
        </p>
        <h1 className="max-w-2xl text-4xl font-medium tracking-tight md:text-5xl">
          Run your motor driving school from one office record.
        </h1>
        <p className="max-w-xl text-base text-muted-foreground">
          Applicants, training, fees, documents, and staff stay with the school that owns them.
          A learner can still send an enquiry to the branch you select below.
        </p>
      </section>

      <section id="office" className="grid gap-6 md:grid-cols-2" aria-labelledby="why-heading">
        <h2 id="why-heading" className="sr-only">
          What the office runs
        </h2>
        {[
          [
            "Applicants",
            "An enquiry becomes a learner record. Staff follow status from the first call through to the licence.",
          ],
          [
            "Training",
            "Book lessons on a vehicle and an instructor, then mark attendance on the day.",
          ],
          [
            "Fees and documents",
            "Record what was paid at the desk and keep each file on that learner.",
          ],
          [
            "Staff",
            "Invite the office, set what each person can do, and give an instructor only today’s students.",
          ],
        ].map(([title, body]) => (
          <div key={title} className="grid gap-2 rounded-2xl border border-black/10 bg-[#fffcf7]/75 p-5 backdrop-blur-[2px]">
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
            ["1. Open the school", "Each school has its own people, courses, and records."],
            ["2. Work the day", "Staff take applicants, lessons, and payments on that school only."],
            ["3. Hand the learner a login", "A student sees their own course, lessons, fees, and documents."],
          ].map(([title, body]) => (
            <li key={title} className="rounded-2xl border border-black/10 bg-white/60 p-5">
              <p className="font-medium">{title}</p>
              <p className="mt-2 text-sm text-muted-foreground">{body}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="grid gap-8 md:grid-cols-2" aria-labelledby="contact-heading">
        <div className="grid gap-3">
          <h2 id="contact-heading" className="text-2xl font-medium tracking-tight">
            Selected school
          </h2>
          <p className="text-sm font-medium">{school.name}</p>
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
          <h2 className="mb-1 text-lg font-medium">Send an enquiry</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            This reaches {school.name} as a learner enquiry. It does not start a software subscription.
          </p>
          <EnquiryForm packages={school.packages} selected={course} schoolId={selected?.id} />
        </div>
      </section>
      </div>
    </div>
  );
}
