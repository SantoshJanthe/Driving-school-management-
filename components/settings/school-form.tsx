"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateSchool, type SchoolFormState } from "@/lib/actions/school";
import type { CoursePackage } from "@/lib/school/packages";

const initial: SchoolFormState = {};

type DraftPackage = CoursePackage & { key: string };

function draftsFrom(packages: CoursePackage[]): DraftPackage[] {
  return packages.map((item, index) => ({ ...item, key: `${item.code}-${index}` }));
}

export function SchoolForm({
  name,
  address,
  phone,
  email,
  packages,
}: {
  name: string;
  address: string;
  phone: string;
  email: string;
  packages: CoursePackage[];
}) {
  const [state, action] = useActionState(updateSchool, initial);
  const [courses, setCourses] = useState<DraftPackage[]>(() => draftsFrom(packages));

  function updateCourse(key: string, patch: Partial<CoursePackage>) {
    setCourses((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  return (
    <form action={action} className="grid gap-8">
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert role="status">
          <AlertDescription>
            School details saved. The public page uses these courses and this contact.
          </AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-4">
        <h2 className="text-sm font-semibold tracking-wide uppercase">Branch</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="school-name">Display name</Label>
            <Input id="school-name" name="name" required defaultValue={name} className="h-11" />
            <p className="text-xs text-muted-foreground">
              Shown on the public page. The product title stays MOTOR DRIVING SCHOOL SOFTWARE.
            </p>
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="school-address">Address</Label>
            <Textarea id="school-address" name="address" rows={3} defaultValue={address} />
          </div>
          <div className="grid gap-1.5 md:col-span-2">
            <Label htmlFor="school-logo">Logo</Label>
            <Input id="school-logo" name="logo" type="file" accept="image/png,image/jpeg,image/webp" />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="school-phone">Phone</Label>
            <Input
              id="school-phone"
              name="contact_phone"
              defaultValue={phone}
              autoComplete="tel"
              className="h-11"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="school-email">Email</Label>
            <Input
              id="school-email"
              name="email"
              type="email"
              defaultValue={email}
              autoComplete="email"
              className="h-11"
            />
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <div className="flex items-end justify-between gap-3">
          <div className="grid gap-1">
            <h2 className="text-sm font-semibold tracking-wide uppercase">Courses and fees</h2>
            <p className="text-sm text-muted-foreground">
              Shown on the public page and offered when someone creates an applicant.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-9"
            disabled={courses.length >= 8}
            onClick={() =>
              setCourses((current) => [
                ...current,
                {
                  key: `new-${current.length}`,
                  code: "",
                  name: "",
                  fee: 0,
                  sessions: 10,
                  summary: "",
                },
              ])
            }
          >
            Add course
          </Button>
        </div>
        <ul className="grid gap-4">
          {courses.map((course, index) => (
            <li
              key={course.key}
              className="grid gap-3 rounded-2xl border border-black/10 bg-[#fffcf7] p-4"
            >
              <div className="grid gap-3 md:grid-cols-4">
                <div className="grid gap-1.5">
                  <Label htmlFor={`package-code-${index}`}>Code</Label>
                  <Input
                    id={`package-code-${index}`}
                    name={`package_code_${index}`}
                    value={course.code}
                    onChange={(event) => updateCourse(course.key, { code: event.target.value })}
                    className="h-11"
                    required
                  />
                </div>
                <div className="grid gap-1.5 md:col-span-2">
                  <Label htmlFor={`package-name-${index}`}>Name</Label>
                  <Input
                    id={`package-name-${index}`}
                    name={`package_name_${index}`}
                    value={course.name}
                    onChange={(event) => updateCourse(course.key, { name: event.target.value })}
                    className="h-11"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`package-fee-${index}`}>Fee (₹)</Label>
                  <Input
                    id={`package-fee-${index}`}
                    name={`package_fee_${index}`}
                    inputMode="decimal"
                    value={course.fee || ""}
                    onChange={(event) =>
                      updateCourse(course.key, { fee: Number(event.target.value) })
                    }
                    className="h-11"
                    required
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[8rem_1fr_auto] md:items-end">
                <div className="grid gap-1.5">
                  <Label htmlFor={`package-sessions-${index}`}>Sessions</Label>
                  <Input
                    id={`package-sessions-${index}`}
                    name={`package_sessions_${index}`}
                    inputMode="numeric"
                    value={course.sessions}
                    onChange={(event) =>
                      updateCourse(course.key, { sessions: Number(event.target.value) })
                    }
                    className="h-11"
                    required
                  />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor={`package-summary-${index}`}>Summary</Label>
                  <Input
                    id={`package-summary-${index}`}
                    name={`package_summary_${index}`}
                    value={course.summary}
                    onChange={(event) => updateCourse(course.key, { summary: event.target.value })}
                    className="h-11"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11"
                  disabled={courses.length <= 1}
                  onClick={() =>
                    setCourses((current) => current.filter((item) => item.key !== course.key))
                  }
                >
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save school details</SubmitButton>
      </div>
    </form>
  );
}
