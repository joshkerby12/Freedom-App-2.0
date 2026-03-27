import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  employmentTypeLabel,
  getEmployees,
  getViewerContext,
  type EmployeeStatusFilter,
} from "@/lib/employees/employee-service";
import { resolvePermission } from "@/lib/employees/employee-service";

type ParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

const statusFilters: Array<{ value: EmployeeStatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
];

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function normalizeStatus(value: string): EmployeeStatusFilter {
  if (value === "all" || value === "active" || value === "on_leave" || value === "terminated") {
    return value;
  }

  return "active";
}

function chipHref(search: string, status: EmployeeStatusFilter): string {
  const params = new URLSearchParams();
  if (search) {
    params.set("search", search);
  }

  if (status !== "active") {
    params.set("status", status);
  }

  const queryString = params.toString();
  return queryString ? `/employees?${queryString}` : "/employees";
}

function statusDot(status: string): string {
  if (status === "active") {
    return "bg-[#2e7d32]";
  }

  if (status === "on_leave") {
    return "bg-[#f9a825]";
  }

  return "bg-[#9e9e9e]";
}

function statusLabel(status: string): string {
  if (status === "on_leave") {
    return "On Leave";
  }

  if (status === "terminated") {
    return "Terminated";
  }

  if (status === "resigned") {
    return "Resigned";
  }

  return "Active";
}

export default async function EmployeesPage({
  searchParams,
}: {
  searchParams: ParamsInput;
}) {
  const params = await Promise.resolve(searchParams);
  const search = readParam(params, "search");
  const status = normalizeStatus(readParam(params, "status"));

  const context = await getViewerContext();
  const [canViewEmployees, canManageEmployees, canManageRoles] = await Promise.all([
    resolvePermission(context.orgId, context.employeeId, "employees.view"),
    resolvePermission(context.orgId, context.employeeId, "employees.manage"),
    resolvePermission(context.orgId, context.employeeId, "settings.manage"),
  ]);

  if (!canViewEmployees) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Employees are restricted</CardTitle>
          <CardDescription>
            You do not have permission to view employee records.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const employees = await getEmployees(context.orgId, { search, status });

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Employees</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Search, filter, and open employee records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          {canManageRoles ? (
            <Link
              href="/settings/roles"
              className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg border border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
            >
              Manage Roles
            </Link>
          ) : null}
          {canManageEmployees ? (
            <Link
              href="/employees/new"
              className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
            >
              Add Employee
            </Link>
          ) : null}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-3">
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Search
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search by first, last, or display name"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Status
              <select
                name="status"
                defaultValue={status}
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                {statusFilters.map((filter) => (
                  <option key={filter.value} value={filter.value}>
                    {filter.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="md:col-span-3">
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
              >
                Apply Filters
              </button>
            </div>
          </form>

          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => {
              const active = filter.value === status;

              return (
                <Link
                  key={filter.value}
                  href={chipHref(search, filter.value)}
                  className={
                    active
                      ? "rounded-full bg-[var(--brand-primary)] px-3 py-1 text-xs font-semibold text-[var(--text-on-primary)]"
                      : "rounded-full border border-[var(--divider)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--text-secondary)] hover:border-[var(--brand-primary)] hover:text-[var(--brand-primary)]"
                  }
                >
                  {filter.label}
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>
            Sorted by last name.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employees.length === 0 ? (
            <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              No employees found for this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    <th className="px-3 py-1">Employee</th>
                    <th className="px-3 py-1">Role</th>
                    <th className="px-3 py-1">Employment Type</th>
                    <th className="px-3 py-1">Status</th>
                    <th className="px-3 py-1">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee) => (
                    <tr key={employee.id} className="rounded-lg bg-[var(--surface)] shadow-[var(--shadow-card)]">
                      <td className="rounded-l-lg px-3 py-3 text-sm font-semibold text-[var(--text-primary)]">
                        <Link href={`/employees/${employee.id}`} className="hover:underline">
                          {employee.displayName}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-sm text-[var(--text-body)]">{employee.roleName}</td>
                      <td className="px-3 py-3 text-sm text-[var(--text-body)]">
                        <span className="rounded-full border border-[var(--divider)] bg-[var(--surface-elevated)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                          {employmentTypeLabel(employee.employmentType)}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-sm text-[var(--text-body)]">
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${statusDot(employee.employeeStatus)}`} />
                          {statusLabel(employee.employeeStatus)}
                        </span>
                      </td>
                      <td className="rounded-r-lg px-3 py-3 text-sm text-[var(--text-secondary)]">
                        {employee.email ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
