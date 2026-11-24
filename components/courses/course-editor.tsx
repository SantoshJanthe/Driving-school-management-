"use client";

import { useActionState, useState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateCourses, type SchoolFormState } from "@/lib/actions/school";
import { formatINR } from "@/lib/format";
import type { CoursePackage } from "@/lib/school/packages";

const initial: SchoolFormState = {};

type DraftPackage = CoursePackage & { key: string };

function draftsFrom(packages: CoursePackage[]): DraftPackage[] {
  return packages.map((item, index) => ({ ...item, key: `${item.code}-${index}` }));
}

export function CourseEditor({ packages }: { packages: CoursePackage[] }) {
  const [state, action] = useActionState(updateCourses, initial);
  const [courses, setCourses] = useState<DraftPackage[]>(() => draftsFrom(packages));

  function updateCourse(key: string, patch: Partial<CoursePackage>) {
    setCourses((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item)),
    );
  }

  return (
    <form action={action} className="grid gap-6">
      {state.error ? (
        <Alert variant="destructive" role="alert">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      {state.ok ? (
        <Alert role="status">
          <AlertDescription>
            Courses saved. New applicants and enquiries use this list.
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="flex items-end justify-between gap-3">
        <p className="max-w-xl text-sm text-muted-foreground">
          Set the courses this school offers. Each fee and session count belongs to your school.
        </p>
        <Button
          type="button"
          variant="outline"
          className="h-9"
          disabled={courses.length >= 8}
          onClick={() =>
            setCourses((current) => [
              ...current,
              {
                key: `new-${current.length}-${Date.now()}`,
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
            className="grid gap-4 rounded-2xl border border-black/10 bg-[#fffcf7] p-5"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {course.code || "New course"}
              </p>
              <p className="text-lg font-medium">
                {course.fee > 0 ? formatINR(course.fee) : "Fee not set"}
              </p>
            </div>
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
            <p className="text-xs text-muted-foreground">
              {course.sessions} sessions included
            </p>
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <SubmitButton pendingText="Saving…">Save courses</SubmitButton>
      </div>
    </form>
  );
}
