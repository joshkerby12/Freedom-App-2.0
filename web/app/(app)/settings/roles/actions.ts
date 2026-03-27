"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  getViewerContext,
  isOrgAdmin,
  resolvePermission,
} from "@/lib/employees/employee-service";
import { PERMISSION_KEYS, type PermissionKey } from "@/lib/employees/permission-keys";
import {
  createRole,
  deleteRole,
  removeOverride,
  setOverride,
  setPermission,
  updateRole,
} from "@/lib/employees/role-service";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = readText(formData, key).toLowerCase();
  return value === "true" || value === "1" || value === "yes" || value === "on";
}

function toPermissionKey(value: string): PermissionKey | null {
  return PERMISSION_KEYS.includes(value as PermissionKey) ? (value as PermissionKey) : null;
}

async function requireSettingsManagePermission(): Promise<{
  orgId: string;
  memberRole: string;
}> {
  const context = await getViewerContext();
  const canManageSettings = await resolvePermission(
    context.orgId,
    context.employeeId,
    "settings.manage",
  );

  if (!canManageSettings) {
    throw new Error("You do not have permission to manage roles and permissions.");
  }

  return {
    orgId: context.orgId,
    memberRole: context.memberRole,
  };
}

function redirectWithError(path: string, error: unknown): never {
  const message = error instanceof Error ? error.message : "Unable to complete this action.";
  const separator = path.includes("?") ? "&" : "?";
  redirect(`${path}${separator}error=${encodeURIComponent(message)}`);
}

export async function createRoleAction(formData: FormData): Promise<void> {
  const returnPath = readText(formData, "returnPath") || "/settings/roles";

  try {
    const { orgId } = await requireSettingsManagePermission();
    const roleName = readText(formData, "name");

    if (!roleName) {
      throw new Error("Role name is required.");
    }

    const roleId = await createRole(orgId, roleName);
    revalidatePath("/settings/roles");
    revalidatePath(`/settings/roles/${roleId}`);
    redirect(`/settings/roles/${roleId}`);
  } catch (error) {
    redirectWithError(returnPath, error);
  }
}

export async function updateRoleNameAction(formData: FormData): Promise<void> {
  const roleId = readText(formData, "roleId");
  const returnPath = readText(formData, "returnPath") || `/settings/roles/${roleId}`;

  try {
    const { orgId } = await requireSettingsManagePermission();
    const roleName = readText(formData, "name");
    await updateRole(orgId, roleId, { name: roleName });
    revalidatePath("/settings/roles");
    revalidatePath(`/settings/roles/${roleId}`);
    redirect(returnPath);
  } catch (error) {
    redirectWithError(returnPath, error);
  }
}

export async function deleteRoleAction(formData: FormData): Promise<void> {
  const roleId = readText(formData, "roleId");
  const returnPath = readText(formData, "returnPath") || "/settings/roles";

  try {
    const { orgId } = await requireSettingsManagePermission();
    await deleteRole(orgId, roleId);
    revalidatePath("/settings/roles");
    redirect("/settings/roles");
  } catch (error) {
    redirectWithError(returnPath, error);
  }
}

export async function setRolePermissionAction(formData: FormData): Promise<void> {
  const roleId = readText(formData, "roleId");
  const returnPath = readText(formData, "returnPath") || `/settings/roles/${roleId}`;

  try {
    const { orgId } = await requireSettingsManagePermission();
    const permissionKey = toPermissionKey(readText(formData, "permissionKey"));
    if (!permissionKey) {
      throw new Error("Invalid permission key.");
    }

    await setPermission(orgId, roleId, permissionKey, readBoolean(formData, "granted"));
    revalidatePath("/settings/roles");
    revalidatePath(`/settings/roles/${roleId}`);
    redirect(returnPath);
  } catch (error) {
    redirectWithError(returnPath, error);
  }
}

export async function setEmployeeOverrideAction(formData: FormData): Promise<void> {
  const employeeId = readText(formData, "employeeId");
  const returnPath = readText(formData, "returnPath") || `/employees/${employeeId}`;

  try {
    const { orgId, memberRole } = await requireSettingsManagePermission();
    if (!isOrgAdmin(memberRole)) {
      throw new Error("Only owner/admin members can set employee overrides.");
    }

    const permissionKey = toPermissionKey(readText(formData, "permissionKey"));
    if (!permissionKey) {
      throw new Error("Invalid permission key.");
    }

    await setOverride(
      orgId,
      employeeId,
      permissionKey,
      readBoolean(formData, "granted"),
    );

    revalidatePath(returnPath);
    redirect(returnPath);
  } catch (error) {
    redirectWithError(returnPath, error);
  }
}

export async function removeEmployeeOverrideAction(formData: FormData): Promise<void> {
  const employeeId = readText(formData, "employeeId");
  const returnPath = readText(formData, "returnPath") || `/employees/${employeeId}`;

  try {
    const { orgId, memberRole } = await requireSettingsManagePermission();
    if (!isOrgAdmin(memberRole)) {
      throw new Error("Only owner/admin members can remove employee overrides.");
    }

    await removeOverride(orgId, readText(formData, "overrideId"));
    revalidatePath(returnPath);
    redirect(returnPath);
  } catch (error) {
    redirectWithError(returnPath, error);
  }
}
