import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerContext, resolvePermission } from "@/lib/employees/employee-service";
import { getRolesWithCounts } from "@/lib/employees/role-service";
import { createRoleAction, deleteRoleAction } from "./actions";

type ParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

export default async function RolesPage({ searchParams }: { searchParams: ParamsInput }) {
  const params = await Promise.resolve(searchParams);
  const errorMessage = readParam(params, "error");
  const search = readParam(params, "search").toLowerCase();

  const context = await getViewerContext();
  const canManageSettings = await resolvePermission(
    context.orgId,
    context.employeeId,
    "settings.manage",
  );

  if (!canManageSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Role management is restricted</CardTitle>
          <CardDescription>You do not have permission to view role settings.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const roles = await getRolesWithCounts(context.orgId);
  const filteredRoles = search
    ? roles.filter((role) => role.name.toLowerCase().includes(search))
    : roles;

  return (
    <section className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Roles</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Manage role definitions and open the permission matrix.
        </p>
      </header>

      {errorMessage ? <p className="auth-feedback-error">{errorMessage}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Add Role</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createRoleAction} className="flex flex-wrap items-end gap-3">
            <label className="flex-1 space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Role Name
              <input
                name="name"
                required
                placeholder="Enter role name"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>
            <input type="hidden" name="returnPath" value="/settings/roles" />
            <button
              type="submit"
              className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
            >
              Add Role
            </button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Role List</CardTitle>
          <CardDescription>System roles are locked from delete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <form className="max-w-sm">
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Search
              <input
                type="search"
                name="search"
                defaultValue={search}
                placeholder="Search role name"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>
          </form>

          {filteredRoles.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No roles found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    <th className="px-3 py-1">Role</th>
                    <th className="px-3 py-1">Employees</th>
                    <th className="px-3 py-1">Type</th>
                    <th className="px-3 py-1">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map((role) => (
                    <tr key={role.id} className="rounded-lg bg-[var(--surface)] shadow-[var(--shadow-card)]">
                      <td className="rounded-l-lg px-3 py-3 text-sm font-semibold text-[var(--text-primary)]">
                        <Link href={`/settings/roles/${role.id}`} className="hover:underline">
                          {role.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-sm text-[var(--text-body)]">{role.employeeCount ?? 0}</td>
                      <td className="px-3 py-3 text-sm text-[var(--text-body)]">
                        {role.isSystem ? (
                          <span className="rounded-full bg-[rgba(66,170,226,0.12)] px-2 py-1 text-xs font-semibold text-[var(--brand-primary-dark)]">
                            System
                          </span>
                        ) : (
                          <span className="rounded-full border border-[var(--divider)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                            Custom
                          </span>
                        )}
                      </td>
                      <td className="rounded-r-lg px-3 py-3 text-sm">
                        {role.isSystem ? (
                          <span className="text-xs font-semibold text-[var(--text-secondary)]">Locked</span>
                        ) : (
                          <form action={deleteRoleAction}>
                            <input type="hidden" name="roleId" value={role.id} />
                            <input type="hidden" name="returnPath" value="/settings/roles" />
                            <button
                              type="submit"
                              className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--error)] px-3 text-xs font-semibold text-[var(--error)] transition-colors hover:bg-[rgba(211,47,47,0.08)]"
                            >
                              Delete
                            </button>
                          </form>
                        )}
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
