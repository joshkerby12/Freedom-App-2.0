"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  employeeStatusOptions,
  employmentTypeOptions,
  initialEmployeeFormActionState,
  payTypeOptions,
  type EmployeeFormActionState,
} from "@/app/(app)/employees/employee-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { RoleRecord } from "@/lib/employees/role-service";

type EmployeeStatus = "active" | "on_leave" | "terminated" | "resigned";

type EmployeeCompensationRecord = {
  id: string;
  payType: "hourly" | "salary";
  payRate: number;
  effectiveDate: string;
  endDate: string | null;
  reason: string | null;
  createdAt: string;
};

type EmployeeFormInitialEmployee = {
  id: string;
  roleId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  personalEmail: string | null;
  companyEmail: string | null;
  phone: string | null;
  address: string | null;
  birthday: string | null;
  startDate: string | null;
  endDate: string | null;
  employeeTitle: string | null;
  employeePosition: string | null;
  employmentType: string | null;
  employeeStatus: EmployeeStatus;
  onVehicleInsurance: boolean;
  hasCompanyCard: boolean;
  companyCardLastFour: string | null;
  isSales: boolean;
  tracksHours: boolean;
  driversLicenseNumber: string | null;
  driversLicenseState: string | null;
  driversLicenseClass: string | null;
  driversLicenseExpiry: string | null;
  medicalCardExpiry: string | null;
  compensationHistory: EmployeeCompensationRecord[];
};

function isTerminalStatus(status: EmployeeStatus): boolean {
  return status === "terminated" || status === "resigned";
}

function suggestedDisplayName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
}

type EmployeeFormAction = (
  previousState: EmployeeFormActionState,
  formData: FormData,
) => Promise<EmployeeFormActionState>;

type EmployeeFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: EmployeeFormAction;
  roles: RoleRecord[];
  canViewCompensation: boolean;
  initialEmployee?: EmployeeFormInitialEmployee;
};

export function EmployeeForm({
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  roles,
  canViewCompensation,
  initialEmployee,
}: EmployeeFormProps) {
  const [state, formAction, pending] = useActionState(action, initialEmployeeFormActionState);

  const [firstName, setFirstName] = useState(initialEmployee?.firstName ?? "");
  const [lastName, setLastName] = useState(initialEmployee?.lastName ?? "");
  const [displayName, setDisplayName] = useState(
    initialEmployee?.displayName &&
      initialEmployee.displayName !== suggestedDisplayName(initialEmployee.firstName, initialEmployee.lastName)
      ? initialEmployee.displayName
      : "",
  );
  const [status, setStatus] = useState(initialEmployee?.employeeStatus ?? "active");
  const [hasCompanyCard, setHasCompanyCard] = useState(initialEmployee?.hasCompanyCard ?? false);
  const [startDate, setStartDate] = useState(initialEmployee?.startDate ?? "");

  const displayPlaceholder = useMemo(
    () => suggestedDisplayName(firstName, lastName) || "First Last",
    [firstName, lastName],
  );

  return (
    <section className="mx-auto w-full max-w-5xl space-y-4">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="text-sm text-[var(--text-secondary)]">{description}</p>
      </header>

      <form
        action={formAction}
        className="space-y-6 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]"
      >
        <input type="hidden" name="currentStatus" value={initialEmployee?.employeeStatus ?? "active"} />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Personal Info
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              name="firstName"
              label="First Name"
              required
              value={firstName}
              onChange={(event) => setFirstName(event.target.value)}
            />
            <Input
              name="lastName"
              label="Last Name"
              required
              value={lastName}
              onChange={(event) => setLastName(event.target.value)}
            />
            <Input
              name="displayName"
              label="Display Name"
              placeholder={displayPlaceholder}
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
            />
            <Input
              name="personalEmail"
              label="Personal Email"
              type="email"
              defaultValue={initialEmployee?.personalEmail ?? ""}
            />
            <Input
              name="companyEmail"
              label="Company Email"
              type="email"
              defaultValue={initialEmployee?.companyEmail ?? ""}
            />
            <Input
              name="phone"
              label="Phone"
              defaultValue={initialEmployee?.phone ?? ""}
            />
            <Input
              name="birthday"
              label="Birthday"
              type="date"
              defaultValue={initialEmployee?.birthday ?? ""}
            />
            <Input
              name="address"
              label="Address"
              defaultValue={initialEmployee?.address ?? ""}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Employment
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Role
              <select
                name="roleId"
                required
                defaultValue={initialEmployee?.roleId ?? roles[0]?.id ?? ""}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                <option value="">Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Employment Type
              <select
                name="employmentType"
                defaultValue={initialEmployee?.employmentType ?? "full_time"}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                {employmentTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Status
              <select
                name="employeeStatus"
                value={status}
                onChange={(event) => setStatus(event.target.value as EmployeeStatus)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                {employeeStatusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Input
              name="employeeTitle"
              label="Employee Title"
              defaultValue={initialEmployee?.employeeTitle ?? ""}
            />

            <Input
              name="employeePosition"
              label="Employee Position"
              defaultValue={initialEmployee?.employeePosition ?? ""}
            />

            <Input
              name="startDate"
              label="Start Date"
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />

            {isTerminalStatus(status as EmployeeStatus) ? (
              <Input
                name="endDate"
                label="End Date"
                type="date"
                defaultValue={initialEmployee?.endDate ?? ""}
              />
            ) : (
              <input type="hidden" name="endDate" value="" />
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="checkbox"
                name="onVehicleInsurance"
                defaultChecked={initialEmployee?.onVehicleInsurance ?? false}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              On Vehicle Insurance
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="checkbox"
                name="hasCompanyCard"
                checked={hasCompanyCard}
                onChange={(event) => setHasCompanyCard(event.target.checked)}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              Has Company Card
            </label>

            {hasCompanyCard ? (
              <Input
                name="companyCardLastFour"
                label="Company Card Last Four"
                maxLength={4}
                defaultValue={initialEmployee?.companyCardLastFour ?? ""}
              />
            ) : (
              <input type="hidden" name="companyCardLastFour" value="" />
            )}

            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="checkbox"
                name="isSales"
                defaultChecked={initialEmployee?.isSales ?? false}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              Sales Employee
            </label>

            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="checkbox"
                name="tracksHours"
                defaultChecked={initialEmployee?.tracksHours ?? true}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              Tracks Hours
            </label>
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Driver Info
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              name="driversLicenseNumber"
              label="Driver License Number"
              defaultValue={initialEmployee?.driversLicenseNumber ?? ""}
            />
            <Input
              name="driversLicenseState"
              label="Driver License State"
              defaultValue={initialEmployee?.driversLicenseState ?? ""}
            />
            <Input
              name="driversLicenseClass"
              label="Driver License Class"
              defaultValue={initialEmployee?.driversLicenseClass ?? ""}
            />
            <Input
              name="driversLicenseExpiry"
              label="Driver License Expiry"
              type="date"
              defaultValue={initialEmployee?.driversLicenseExpiry ?? ""}
            />
            <Input
              name="medicalCardExpiry"
              label="Medical Card Expiry"
              type="date"
              defaultValue={initialEmployee?.medicalCardExpiry ?? ""}
            />
          </div>
        </section>

        {canViewCompensation ? (
          <section className="space-y-3 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Compensation
            </h2>
            <p className="text-xs text-[var(--text-secondary)]">
              Saving compensation on edit always creates a new history row.
            </p>

            <div className="grid gap-4 md:grid-cols-3">
              <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                Pay Type
                <select
                  name="payType"
                  defaultValue={initialEmployee?.compensationHistory[0]?.payType ?? "hourly"}
                  className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                >
                  {payTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <Input
                name="payRate"
                label="Pay Rate"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  typeof initialEmployee?.compensationHistory[0]?.payRate === "number"
                    ? String(initialEmployee.compensationHistory[0].payRate)
                    : ""
                }
              />

              <Input
                name="effectiveDate"
                label="Effective Date"
                type="date"
                defaultValue={
                  initialEmployee?.compensationHistory[0]?.effectiveDate ??
                  initialEmployee?.startDate ??
                  startDate
                }
              />
            </div>

            <Input
              name="compensationReason"
              label="Reason"
              defaultValue=""
              placeholder="Optional note for compensation history"
            />
          </section>
        ) : null}

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
    </section>
  );
}
