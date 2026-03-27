import { createClient } from "@/lib/supabase/server";
import { PERMISSION_KEYS, type PermissionKey } from "@/lib/employees/permission-keys";

export type RoleRecord = {
  id: string;
  name: string;
  isSystem: boolean;
  sortOrder: number;
  employeeCount?: number;
};

export type RolePermissionRecord = {
  id: string;
  roleId: string;
  permissionKey: PermissionKey;
  granted: boolean;
};

export type EmployeeOverrideRecord = {
  id: string;
  employeeId: string;
  permissionKey: PermissionKey;
  granted: boolean;
};

export type RoleEmployeeRecord = {
  id: string;
  displayName: string;
  employeeStatus: string;
};

export type RoleDetailRecord = {
  role: RoleRecord;
  permissions: RolePermissionRecord[];
  employees: RoleEmployeeRecord[];
};

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readRequiredString(value: unknown, fallback = ""): string {
  return readOptionalString(value) ?? fallback;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function parsePermissionKey(value: unknown): PermissionKey {
  const key = readRequiredString(value);
  if (PERMISSION_KEYS.includes(key as PermissionKey)) {
    return key as PermissionKey;
  }

  return "employees.view";
}

function displayNameFromRow(row: Record<string, unknown>): string {
  const explicit = readOptionalString(row.display_name);
  if (explicit) {
    return explicit;
  }

  const first = readRequiredString(row.first_name);
  const last = readRequiredString(row.last_name);
  return `${first} ${last}`.trim() || "Unnamed employee";
}

async function assertNoError(error: { message: string } | null, context: string): Promise<void> {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function getRoles(orgId: string): Promise<RoleRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("roles")
    .select("id,name,is_system,sort_order")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  await assertNoError(error, "Failed to load roles");

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: readRequiredString(row.name, "Unnamed role"),
    isSystem: readBoolean(row.is_system),
    sortOrder: Number(row.sort_order ?? 0),
  }));
}

export async function getRolesWithCounts(orgId: string): Promise<RoleRecord[]> {
  const supabase = await createClient();
  const roles = await getRoles(orgId);

  const roleIds = roles.map((role) => role.id);
  if (!roleIds.length) {
    return roles;
  }

  const { data, error } = await supabase
    .from("employees")
    .select("role_id")
    .eq("org_id", orgId)
    .in("role_id", roleIds);

  await assertNoError(error, "Failed to load employee role counts");

  const countByRoleId = new Map<string, number>();
  for (const row of (data ?? []) as Array<Record<string, unknown>>) {
    const roleId = readOptionalString(row.role_id);
    if (!roleId) {
      continue;
    }

    countByRoleId.set(roleId, (countByRoleId.get(roleId) ?? 0) + 1);
  }

  return roles.map((role) => ({
    ...role,
    employeeCount: countByRoleId.get(role.id) ?? 0,
  }));
}

export async function createRole(orgId: string, name: string): Promise<string> {
  const supabase = await createClient();
  const trimmedName = name.trim();

  if (!trimmedName) {
    throw new Error("Role name is required.");
  }

  const { data: maxSortRow, error: maxSortError } = await supabase
    .from("roles")
    .select("sort_order")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await assertNoError(maxSortError, "Failed to resolve role order");

  const { data: createdRole, error } = await supabase
    .from("roles")
    .insert({
      org_id: orgId,
      name: trimmedName,
      is_system: false,
      sort_order: Number(maxSortRow?.sort_order ?? 0) + 1,
    })
    .select("id")
    .single();

  await assertNoError(error, "Failed to create role");

  return String(createdRole.id);
}

export async function updateRole(
  orgId: string,
  roleId: string,
  input: { name?: string; sortOrder?: number },
): Promise<void> {
  const supabase = await createClient();
  const updates: Record<string, string | number> = {};

  if (typeof input.name === "string" && input.name.trim()) {
    updates.name = input.name.trim();
  }

  if (typeof input.sortOrder === "number" && Number.isFinite(input.sortOrder)) {
    updates.sort_order = Math.max(0, Math.round(input.sortOrder));
  }

  if (!Object.keys(updates).length) {
    return;
  }

  const { error } = await supabase
    .from("roles")
    .update(updates)
    .eq("org_id", orgId)
    .eq("id", roleId);

  await assertNoError(error, "Failed to update role");
}

export async function deleteRole(orgId: string, roleId: string): Promise<void> {
  const supabase = await createClient();

  const { data: role, error: roleError } = await supabase
    .from("roles")
    .select("is_system")
    .eq("org_id", orgId)
    .eq("id", roleId)
    .limit(1)
    .maybeSingle();

  await assertNoError(roleError, "Failed to load role");

  if (role?.is_system === true) {
    throw new Error("System roles cannot be deleted.");
  }

  const { data: employees, error: employeeError } = await supabase
    .from("employees")
    .select("id")
    .eq("org_id", orgId)
    .eq("role_id", roleId)
    .limit(1);

  await assertNoError(employeeError, "Failed to check role assignments");

  if ((employees ?? []).length > 0) {
    throw new Error("This role is assigned to one or more employees and cannot be deleted.");
  }

  const { error } = await supabase
    .from("roles")
    .delete()
    .eq("org_id", orgId)
    .eq("id", roleId);

  await assertNoError(error, "Failed to delete role");
}

export async function getRolePermissions(
  orgId: string,
  roleId: string,
): Promise<RolePermissionRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("role_permissions")
    .select("id,role_id,permission_key,granted")
    .eq("org_id", orgId)
    .eq("role_id", roleId)
    .order("permission_key", { ascending: true });

  await assertNoError(error, "Failed to load role permissions");

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    roleId: readRequiredString(row.role_id),
    permissionKey: parsePermissionKey(row.permission_key),
    granted: readBoolean(row.granted),
  }));
}

export async function setPermission(
  orgId: string,
  roleId: string,
  permissionKey: PermissionKey,
  granted: boolean,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("role_permissions").upsert(
    {
      org_id: orgId,
      role_id: roleId,
      permission_key: permissionKey,
      granted,
    },
    {
      onConflict: "role_id,permission_key",
    },
  );

  await assertNoError(error, "Failed to save role permission");
}

export async function getEmployeeOverrides(
  orgId: string,
  employeeId: string,
): Promise<EmployeeOverrideRecord[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("employee_permission_overrides")
    .select("id,employee_id,permission_key,granted")
    .eq("org_id", orgId)
    .eq("employee_id", employeeId)
    .order("permission_key", { ascending: true });

  await assertNoError(error, "Failed to load employee overrides");

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    employeeId: readRequiredString(row.employee_id),
    permissionKey: parsePermissionKey(row.permission_key),
    granted: readBoolean(row.granted),
  }));
}

export async function setOverride(
  orgId: string,
  employeeId: string,
  permissionKey: PermissionKey,
  granted: boolean,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("employee_permission_overrides").upsert(
    {
      org_id: orgId,
      employee_id: employeeId,
      permission_key: permissionKey,
      granted,
    },
    {
      onConflict: "employee_id,permission_key",
    },
  );

  await assertNoError(error, "Failed to save employee override");
}

export async function removeOverride(orgId: string, overrideId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employee_permission_overrides")
    .delete()
    .eq("org_id", orgId)
    .eq("id", overrideId);

  await assertNoError(error, "Failed to remove override");
}

export async function getRoleDetail(orgId: string, roleId: string): Promise<RoleDetailRecord | null> {
  const supabase = await createClient();

  const { data: roleRow, error: roleError } = await supabase
    .from("roles")
    .select("id,name,is_system,sort_order")
    .eq("org_id", orgId)
    .eq("id", roleId)
    .limit(1)
    .maybeSingle();

  await assertNoError(roleError, "Failed to load role");

  if (!roleRow) {
    return null;
  }

  const [permissions, employees] = await Promise.all([
    getRolePermissions(orgId, roleId),
    supabase
      .from("employees")
      .select("id,display_name,first_name,last_name,employee_status")
      .eq("org_id", orgId)
      .eq("role_id", roleId)
      .order("last_name", { ascending: true })
      .order("first_name", { ascending: true }),
  ]);

  await assertNoError(employees.error, "Failed to load role assignments");

  return {
    role: {
      id: String(roleRow.id),
      name: readRequiredString(roleRow.name),
      isSystem: readBoolean(roleRow.is_system),
      sortOrder: Number(roleRow.sort_order ?? 0),
    },
    permissions,
    employees: ((employees.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
      id: String(row.id),
      displayName: displayNameFromRow(row),
      employeeStatus: readRequiredString(row.employee_status, "active"),
    })),
  };
}
