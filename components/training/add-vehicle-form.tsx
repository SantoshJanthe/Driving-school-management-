"use client";

import { useActionState } from "react";

import { SubmitButton } from "@/components/auth/submit-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addVehicle, type SessionFormState } from "@/lib/actions/training";
import { VEHICLE_TYPES } from "@/lib/training/constants";

const initial: SessionFormState = {};

export function AddVehicleForm() {
  const [state, action] = useActionState(addVehicle, initial);
  return (
    <form action={action} className="grid max-w-xl gap-3 rounded-xl border p-4">
      <h2 className="text-sm font-semibold">Add a vehicle</h2>
      {state.error ? (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-[1fr_8rem_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="vehicle-name">Name</Label>
          <Input id="vehicle-name" name="name" required placeholder="Car 2 · MH12" className="h-11" />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="vehicle-type">Type</Label>
          <select
            id="vehicle-type"
            name="vehicle_type"
            className="border-input bg-background h-11 w-full rounded-lg border px-2.5 text-sm"
            defaultValue="LMV"
          >
            {VEHICLE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <SubmitButton pendingText="Adding…" className="sm:w-auto">
          Add vehicle
        </SubmitButton>
      </div>
    </form>
  );
}
