import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getViewerContext, resolvePermission } from "@/lib/employees/employee-service";
import { PERMISSION_GROUPS } from "@/lib/employees/permission-keys";
import { getRoleDetail } from "@/lib/employees/role-service";
import { deleteRoleAction, setRolePermissionAction, updateRoleNameAction } from "../actions";

type ParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

type RoleDetailPageProps = {
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

function permissionKeyLabel(value: string): string {
  return value
    .split(".")
    .map((segment) =>
      segment
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    )
    .join(" / ");
}

export default async function RoleDetailPage({ params, searchParams }: RoleDetailPageProps) {
  const { id } = await params;
  const queryParams = await Promise.resolve(searchParams);
  const errorMessage = readParam(queryParams, "error");

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
          <CardTitle>Role settings are restricted</CardTitle>
          <CardDescription>You do not have permission to manage roles.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const detail = await getRoleDetail(context.orgId, id);
  if (!detail) {
    notFound();
  }

  const permissionByKey = new Map<string, boolean>();
  for (const permission of detail.permissions) {
    permissionByKey.set(permission.permissionKey, permission.granted);
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{detail.role.name}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Permission matrix and employee assignments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/settings/roles"
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--brand-primary)] px-3 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
          >
            Back to Roles
          </Link>
          {detail.role.isSystem ? (
            <span className="inline-flex min-h-9 items-center rounded-full bg-[rgba(66,170,226,0.12)] px-3 text-xs font-semibold text-[var(--brand-primary-dark)]">
              System Role
            </span>
          ) : (
            <form action={deleteRoleAction}>
              <input type="hidden" name="roleId" value={detail.role.id} />
              <input type="hidden" name="returnPath" value={`/settings/roles/${detail.role.id}`} />
              <button
                type="submit"
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--error)] px-3 text-sm font-semibold text-[var(--error)] transition-colors hover:bg-[rgba(211,47,47,0.08)]"
              >
                Delete Role
              </button>
            </form>
          )}
        </div>
      </header>

      {errorMessage ? <p className="auth-feedback-error">{errorMessage}</p> : null}

      {!detail.role.isSystem ? (
        <Card>
          <CardHeader>
            <CardTitle>Role Name</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={updateRoleNameAction} className="flex flex-wrap items-end gap-3">
              <label className="flex-1 space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                Role Name
                <input
                  name="name"
                  required
                  defaultValue={detail.role.name}
                  className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                />
              </label>
              <input type="hidden" name="roleId" value={detail.role.id} />
              <input type="hidden" name="returnPath" value={`/settings/roles/${detail.role.id}`} />
              <button
                type="submit"
                className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
              >
                Save Name
              </button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Permission Matrix</CardTitle>
          <CardDescription>Each toggle saves immediately.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {PERMISSION_GROUPS.map((group) => (
            <div key={group.label} className="space-y-2 rounded-lg border border-[var(--divider)] p-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)]">{group.label}</h2>
              <ul className="space-y-2">
                {group.keys.map((key) => {
                  const granted = permissionByKey.get(key) ?? false;
                  const nextGranted = granted ? "false" : "true";

                  return (
                    <li key={key} className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm text-[var(--text-body)]">{permissionKeyLabel(key)}</p>
                        <p className="text-xs text-[var(--text-secondary)]">
                          Current: {granted ? "Allowed" : "Denied"}
                        </p>
                      </div>
                      <form action={setRolePermissionAction}>
                        <input type="hidden" name="roleId" value={detail.role.id} />
                        <input type="hidden" name="permissionKey" value={key} />
                        <input type="hidden" name="granted" value={nextGranted} />
                        <input type="hidden" name="returnPath" value={`/settings/roles/${detail.role.id}`} />
                        <button
                          type="submit"
                          className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--brand-primary)] px-3 text-xs font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
                        >
                          Set {granted ? "Denied" : "Allowed"}
                        </button>
                      </form>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Employees With This Role</CardTitle>
        </CardHeader>
        <CardContent>
          {detail.employees.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No employees are currently assigned.</p>
          ) : (
            <ul className="space-y-2">
              {detail.employees.map((employee) => (
                <li key={employee.id} className="rounded-lg border border-[var(--divider)] px-3 py-2">
                  <Link
                    href={`/employees/${employee.id}`}
                    className="text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]"
                  >
                    {employee.displayName}
                  </Link>
                  <p className="text-xs text-[var(--text-secondary)]">{employee.employeeStatus}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
