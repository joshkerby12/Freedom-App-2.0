import Link from "next/link";
import { notFound } from "next/navigation";
import { revokeInviteAction, sendInviteAction } from "@/app/(app)/employees/actions";
import {
  removeEmployeeOverrideAction,
  setEmployeeOverrideAction,
} from "@/app/(app)/settings/roles/actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  employmentTypeLabel,
  getEmployee,
  getViewerContext,
  isOrgAdmin,
  resolvePermission,
  statusLabel,
} from "@/lib/employees/employee-service";
import { PERMISSION_KEYS } from "@/lib/employees/permission-keys";
import { getEmployeeOverrides, getRolePermissions } from "@/lib/employees/role-service";

type ParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

type EmployeeDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: ParamsInput;
};

function readParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function fmtDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString();
}

function boolLabel(value: boolean): string {
  return value ? "Yes" : "No";
}

function initials(firstName: string, lastName: string): string {
  const first = firstName.trim()[0] ?? "";
  const last = lastName.trim()[0] ?? "";
  const joined = `${first}${last}`.trim().toUpperCase();
  return joined || "?";
}

function statusBadgeClass(status: string): string {
  if (status === "active") {
    return "bg-[#e8f4ec] text-[#24683a]";
  }

  if (status === "on_leave") {
    return "bg-[#fff8e1] text-[#8f6b00]";
  }

  return "bg-[#f0f0f0] text-[var(--text-secondary)]";
}

function daysUntil(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const target = new Date(value);
  if (Number.isNaN(target.getTime())) {
    return null;
  }

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfTarget = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const diffMs = startOfTarget.getTime() - startOfToday.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

function expiryTone(value: string | null): string {
  const days = daysUntil(value);
  if (days == null) {
    return "text-[var(--text-body)]";
  }

  if (days <= 30) {
    return "text-[#c62828]";
  }

  if (days <= 60) {
    return "text-[#b28704]";
  }

  return "text-[var(--text-body)]";
}

function permissionLabel(permissionKey: string): string {
  return permissionKey
    .split(".")
    .map((segment) =>
      segment
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    )
    .join(" / ");
}

export default async function EmployeeDetailPage({ params, searchParams }: EmployeeDetailPageProps) {
  const { id } = await params;
  const queryParams = await Promise.resolve(searchParams);
  const inviteError = readParam(queryParams, "inviteError");

  const context = await getViewerContext();
  const [canViewEmployees, canManageEmployees, canViewCompensation] = await Promise.all([
    resolvePermission(context.orgId, context.employeeId, "employees.view"),
    resolvePermission(context.orgId, context.employeeId, "employees.manage"),
    resolvePermission(context.orgId, context.employeeId, "compensation.view"),
  ]);

  if (!canViewEmployees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employee details are restricted</CardTitle>
          <CardDescription>You do not have permission to view this page.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const employee = await getEmployee(context.orgId, id, {
    includeCompensation: canViewCompensation,
  });

  if (!employee) {
    notFound();
  }

  const canUseAdminPanels = isOrgAdmin(context.memberRole);
  const [rolePermissions, overrides] = canUseAdminPanels
    ? await Promise.all([
        getRolePermissions(context.orgId, employee.roleId),
        getEmployeeOverrides(context.orgId, employee.id),
      ])
    : [[], []];

  const roleGrantedByKey = new Map<string, boolean>();
  for (const permission of rolePermissions) {
    roleGrantedByKey.set(permission.permissionKey, permission.granted);
  }

  const overrideByKey = new Map<string, (typeof overrides)[number]>();
  for (const override of overrides) {
    overrideByKey.set(override.permissionKey, override);
  }

  const latestComp = employee.compensationHistory[0] ?? null;
  const returnPath = `/employees/${employee.id}`;
  const sendInviteEmail =
    employee.latestInvite?.email ?? employee.companyEmail ?? employee.personalEmail ?? "";

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[rgba(66,170,226,0.18)] text-lg font-semibold text-[var(--brand-primary-dark)]">
            {initials(employee.firstName, employee.lastName)}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{employee.displayName}</h1>
            <p className="text-sm text-[var(--text-secondary)]">
              {employee.roleName} / {employmentTypeLabel(employee.employmentType)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClass(employee.employeeStatus)}`}>
            {statusLabel(employee.employeeStatus)}
          </span>
          {canManageEmployees ? (
            <Link
              href={`/employees/${employee.id}/edit`}
              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--brand-primary)] px-3 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
            >
              Edit Employee
            </Link>
          ) : null}
        </div>
      </header>

      {inviteError ? <p className="auth-feedback-error">{inviteError}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Personal Info</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">First Name</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.firstName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Last Name</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.lastName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Display Name</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.displayName}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Personal Email</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.personalEmail ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Company Email</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.companyEmail ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Phone</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.phone ?? "-"}</dd>
            </div>
            <div className="md:col-span-2">
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Address</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.address ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Birthday</dt>
              <dd className="text-sm text-[var(--text-body)]">{fmtDate(employee.birthday)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Start Date</dt>
              <dd className="text-sm text-[var(--text-body)]">{fmtDate(employee.startDate)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">End Date</dt>
              <dd className="text-sm text-[var(--text-body)]">{fmtDate(employee.endDate)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employment</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Title</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.employeeTitle ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Position</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.employeePosition ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Employment Type</dt>
              <dd className="text-sm text-[var(--text-body)]">{employmentTypeLabel(employee.employmentType)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Status</dt>
              <dd className="text-sm text-[var(--text-body)]">{statusLabel(employee.employeeStatus)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Crew</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.crewName ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">On Vehicle Insurance</dt>
              <dd className="text-sm text-[var(--text-body)]">{boolLabel(employee.onVehicleInsurance)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Has Company Card</dt>
              <dd className="text-sm text-[var(--text-body)]">{boolLabel(employee.hasCompanyCard)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Company Card Last Four</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.companyCardLastFour ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Sales Employee</dt>
              <dd className="text-sm text-[var(--text-body)]">{boolLabel(employee.isSales)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Tracks Hours</dt>
              <dd className="text-sm text-[var(--text-body)]">{boolLabel(employee.tracksHours)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Driver Info</CardTitle>
          <CardDescription>Expiry warnings turn red at 30 days and yellow at 60 days.</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 md:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">License Number</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.driversLicenseNumber ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">License State</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.driversLicenseState ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">License Class</dt>
              <dd className="text-sm text-[var(--text-body)]">{employee.driversLicenseClass ?? "-"}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">License Expiry</dt>
              <dd className={`text-sm ${expiryTone(employee.driversLicenseExpiry)}`}>{fmtDate(employee.driversLicenseExpiry)}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">Medical Card Expiry</dt>
              <dd className={`text-sm ${expiryTone(employee.medicalCardExpiry)}`}>{fmtDate(employee.medicalCardExpiry)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Compensation</CardTitle>
        </CardHeader>
        <CardContent>
          {canViewCompensation ? (
            employee.compensationHistory.length > 0 ? (
              <div className="space-y-3">
                <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">Current</p>
                  <p className="text-sm text-[var(--text-body)]">
                    {latestComp?.payType === "salary" ? "Salary" : "Hourly"} / ${latestComp?.payRate.toFixed(2)}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">Effective {fmtDate(latestComp?.effectiveDate ?? null)}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">History</p>
                  <ul className="space-y-2">
                    {employee.compensationHistory.map((entry) => (
                      <li key={entry.id} className="rounded-lg border border-[var(--divider)] px-3 py-2">
                        <p className="text-sm text-[var(--text-body)]">
                          {entry.payType === "salary" ? "Salary" : "Hourly"} / ${entry.payRate.toFixed(2)}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)]">Effective {fmtDate(entry.effectiveDate)}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[var(--text-secondary)]">No compensation records yet.</p>
            )
          ) : (
            <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              Restricted - you do not have access to compensation details.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Custom Fields</CardTitle>
        </CardHeader>
        <CardContent>
          {employee.customFields.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No custom employee fields are configured.</p>
          ) : (
            <ul className="space-y-2">
              {employee.customFields.map((field) => (
                <li key={field.id} className="rounded-lg border border-[var(--divider)] px-3 py-2">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">{field.name}</p>
                  <p className="text-sm text-[var(--text-body)]">{field.value ?? "-"}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {canUseAdminPanels ? (
        <Card>
          <CardHeader>
            <CardTitle>Invite Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {employee.latestInvite?.status === "pending" ? (
              <>
                <p className="text-sm text-[var(--text-body)]">
                  Pending invite for <span className="font-semibold">{employee.latestInvite.email}</span>
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  Sent {fmtDate(employee.latestInvite.invitedAt)} / Expires {fmtDate(employee.latestInvite.expiresAt)}
                </p>
                <form action={revokeInviteAction} className="flex flex-wrap gap-2">
                  <input type="hidden" name="employeeId" value={employee.id} />
                  <input type="hidden" name="inviteId" value={employee.latestInvite.id} />
                  <input type="hidden" name="returnPath" value={returnPath} />
                  <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--error)] px-3 text-sm font-semibold text-[var(--error)] transition-colors hover:bg-[rgba(211,47,47,0.08)]">
                    Revoke Invite
                  </button>
                </form>
              </>
            ) : null}

            {employee.latestInvite?.status === "accepted" ? (
              <>
                <p className="text-sm text-[var(--text-body)]">
                  Linked account: <span className="font-semibold">{employee.latestInvite.email}</span>
                </p>
                <p className="text-xs text-[var(--text-secondary)]">Accepted {fmtDate(employee.latestInvite.acceptedAt)}</p>
              </>
            ) : null}

            {(employee.latestInvite?.status === "expired" || employee.latestInvite?.status === "revoked") && sendInviteEmail ? (
              <form action={sendInviteAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="employeeId" value={employee.id} />
                <input type="hidden" name="email" value={sendInviteEmail} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--brand-primary)] px-3 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]">
                  Resend Invite
                </button>
              </form>
            ) : null}

            {(employee.latestInvite?.status === "expired" || employee.latestInvite?.status === "revoked") && !sendInviteEmail ? (
              <p className="text-xs text-[var(--error)]">Add a company or personal email to resend an invite.</p>
            ) : null}

            {!employee.latestInvite && !employee.supabaseAuthUid && sendInviteEmail ? (
              <form action={sendInviteAction} className="flex flex-wrap gap-2">
                <input type="hidden" name="employeeId" value={employee.id} />
                <input type="hidden" name="email" value={sendInviteEmail} />
                <input type="hidden" name="returnPath" value={returnPath} />
                <button type="submit" className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--brand-primary)] px-3 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]">
                  Send Invite
                </button>
              </form>
            ) : null}

            {!employee.latestInvite && !employee.supabaseAuthUid && !sendInviteEmail ? (
              <p className="text-xs text-[var(--error)]">Add a company or personal email before sending an invite.</p>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {canUseAdminPanels ? (
        <Card>
          <CardHeader>
            <CardTitle>Permission Overrides</CardTitle>
            <CardDescription>Owner/admin controls for per-employee permission overrides.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {PERMISSION_KEYS.map((permissionKey) => {
                const roleDefault = roleGrantedByKey.get(permissionKey) ?? false;
                const override = overrideByKey.get(permissionKey);
                const effectiveValue = override ? override.granted : roleDefault;

                return (
                  <li key={permissionKey} className="rounded-lg border border-[var(--divider)] px-3 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-[var(--text-primary)]">{permissionLabel(permissionKey)}</p>
                        <p className="text-xs text-[var(--text-secondary)]">Role default: {roleDefault ? "Allowed" : "Denied"}</p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {override ? (
                          <span className="rounded-full bg-[rgba(66,170,226,0.12)] px-2 py-1 text-xs font-semibold text-[var(--brand-primary-dark)]">Using override</span>
                        ) : null}

                        <span className="rounded-full border border-[var(--divider)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">{effectiveValue ? "Allowed" : "Denied"}</span>

                        <form action={setEmployeeOverrideAction}>
                          <input type="hidden" name="employeeId" value={employee.id} />
                          <input type="hidden" name="permissionKey" value={permissionKey} />
                          <input type="hidden" name="granted" value={effectiveValue ? "false" : "true"} />
                          <input type="hidden" name="returnPath" value={returnPath} />
                          <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--brand-primary)] px-3 text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]">
                            Set {effectiveValue ? "Denied" : "Allowed"}
                          </button>
                        </form>

                        {override ? (
                          <form action={removeEmployeeOverrideAction}>
                            <input type="hidden" name="overrideId" value={override.id} />
                            <input type="hidden" name="employeeId" value={employee.id} />
                            <input type="hidden" name="returnPath" value={returnPath} />
                            <button type="submit" className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--error)] px-3 text-xs font-semibold text-[var(--error)] transition-colors hover:bg-[rgba(211,47,47,0.08)]" title="Remove override">
                              X
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <Link href="/employees" className="inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]">
        Back to employees
      </Link>
    </section>
  );
}
