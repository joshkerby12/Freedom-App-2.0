"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { CrewFormActionState } from "@/app/(app)/crews/crew-types";
import { initialCrewFormActionState } from "@/app/(app)/crews/crew-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CrewLeadOption } from "@/lib/crews/crew-service";

type CrewFormAction = (
  previousState: CrewFormActionState,
  formData: FormData,
) => Promise<CrewFormActionState>;

type CrewFormValues = {
  name: string;
  crewLeadId: string;
  isActive: boolean;
  notes: string;
};

type CrewFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: CrewFormAction;
  crewLeadOptions: CrewLeadOption[];
  initialValues?: Partial<CrewFormValues>;
};

const emptyCrewValues: CrewFormValues = {
  name: "",
  crewLeadId: "",
  isActive: true,
  notes: "",
};

export function CrewForm({
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  crewLeadOptions,
  initialValues,
}: CrewFormProps) {
  const [state, formAction, pending] = useActionState(action, initialCrewFormActionState);
  const values: CrewFormValues = {
    ...emptyCrewValues,
    ...initialValues,
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <Input
            name="name"
            label="Crew Name"
            placeholder="Crew A"
            required
            defaultValue={values.name}
          />

          <div className="space-y-2">
            <label
              htmlFor="crewLeadId"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
              Crew Lead
            </label>
            <select
              id="crewLeadId"
              name="crewLeadId"
              defaultValue={values.crewLeadId}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)] outline-none transition-colors focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[rgba(66,170,226,0.2)]"
            >
              <option value="">No lead assigned</option>
              {crewLeadOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.roleName ? `${option.label} (${option.roleName})` : option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="notes"
              className="block text-xs font-medium text-[var(--text-secondary)]"
            >
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={4}
              defaultValue={values.notes}
              className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-body)] outline-none transition-colors placeholder:text-[var(--text-secondary)] focus:border-[var(--brand-primary)] focus:ring-2 focus:ring-[rgba(66,170,226,0.2)]"
              placeholder="Optional notes about this crew..."
            />
          </div>

          <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-[var(--text-body)]">
            <input
              type="checkbox"
              name="isActive"
              value="true"
              defaultChecked={values.isActive}
              className="h-4 w-4 rounded border-[var(--divider)] text-[var(--brand-primary)] focus:ring-[rgba(66,170,226,0.2)]"
            />
            Crew is active
          </label>

          {state.error ? <p className="auth-feedback-error">{state.error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={pending}>
              {submitLabel}
            </Button>
            <Link
              href={cancelHref}
              className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg border border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
