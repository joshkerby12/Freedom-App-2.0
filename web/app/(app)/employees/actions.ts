"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addCompensation,
  createEmployee,
  EMPLOYEE_STATUSES,
  getViewerContext,
  isOrgAdmin,
  resolvePermission,
  transitionStatus,
  type EmployeeStatus,
  type EmployeeWriteInput,
  updateEmployee,
} from "@/lib/employees/employee-service";
import { revokeInvite, sendInvite } from "@/lib/employees/invite-service";
import type { EmployeeFormActionState } from "./employee-types";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value ? value : null;
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function readNumber(formData: FormData, key: string): number | null {
  const value = readText(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseStatus(value: string): EmployeeStatus {
  return EMPLOYEE_STATUSES.includes(value as EmployeeStatus)
    ? (value as EmployeeStatus)
    : "active";
}

function todayYmd(): string {
  return new Date().toISOString().slice(0, 10);
}

function buildEmployeeInput(formData: FormData): EmployeeWriteInput {
  return {
    roleId: readText(formData, "roleId"),
    firstName: readText(formData, "firstName"),
    lastName: readText(formData, "lastName"),
    displayName: readOptionalText(formData, "displayName"),
    personalEmail: readOptionalText(formData, "personalEmail"),
    companyEmail: readOptionalText(formData, "companyEmail"),
    phone: readOptionalText(formData, "phone"),
    address: readOptionalText(formData, "address"),
    birthday: readOptionalText(formData, "birthday"),
    startDate: readOptionalText(formData, "startDate"),
    endDate: readOptionalText(formData, "endDate"),
    employeeTitle: readOptionalText(formData, "employeeTitle"),
    employeePosition: readOptionalText(formData, "employeePosition"),
    employmentType: (readOptionalText(formData, "employmentType") ?? "full_time") as EmployeeWriteInput["employmentType"],
    employeeStatus: parseStatus(readText(formData, "employeeStatus") || "active"),
    crewId: readOptionalText(formData, "crewId"),
    onVehicleInsurance: readBoolean(formData, "onVehicleInsurance"),
    hasCompanyCard: readBoolean(formData, "hasCompanyCard"),
    companyCardLastFour: readOptionalText(formData, "companyCardLastFour"),
    isSales: readBoolean(formData, "isSales"),
    tracksHours: readBoolean(formData, "tracksHours"),
    driversLicenseNumber: readOptionalText(formData, "driversLicenseNumber"),
    driversLicenseState: readOptionalText(formData, "driversLicenseState"),
    driversLicenseClass: readOptionalText(formData, "driversLicenseClass"),
    driversLicenseExpiry: readOptionalText(formData, "driversLicenseExpiry"),
    medicalCardExpiry: readOptionalText(formData, "medicalCardExpiry"),
  };
}

async function requireManagePermission(): Promise<{
  orgId: string;
  employeeId: string | null;
}> {
  const context = await getViewerContext();
  const canManage = await resolvePermission(
    context.orgId,
    context.employeeId,
    "employees.manage",
  );

  if (!canManage) {
    throw new Error("You do not have permission to manage employees.");
  }

  return {
    orgId: context.orgId,
    employeeId: context.employeeId,
  };
}

async function maybeAddCompensation(
  orgId: string,
  targetEmployeeId: string,
  actingEmployeeId: string | null,
  formData: FormData,
): Promise<void> {
  const canViewCompensation = await resolvePermission(
    orgId,
    actingEmployeeId,
    "compensation.view",
  );

  if (!canViewCompensation) {
    return;
  }

  const payRate = readNumber(formData, "payRate");
  const payType = readText(formData, "payType");

  if (payRate == null || !payType) {
    return;
  }

  const effectiveDate =
    readText(formData, "effectiveDate") ||
    readText(formData, "startDate") ||
    todayYmd();

  await addCompensation(orgId, targetEmployeeId, {
    payType: payType === "salary" ? "salary" : "hourly",
    payRate,
    effectiveDate,
    reason: readOptionalText(formData, "compensationReason"),
    createdBy: actingEmployeeId,
  });
}

function ensureRequiredFields(input: EmployeeWriteInput): string | null {
  if (!input.firstName) {
    return "First name is required.";
  }

  if (!input.lastName) {
    return "Last name is required.";
  }

  if (!input.roleId) {
    return "Role is required.";
  }

  return null;
}

export async function createEmployeeAction(
  _previousState: EmployeeFormActionState,
  formData: FormData,
): Promise<EmployeeFormActionState> {
  try {
    const { orgId, employeeId } = await requireManagePermission();
    const input = buildEmployeeInput(formData);

    const validationError = ensureRequiredFields(input);
    if (validationError) {
      return { error: validationError };
    }

    const createdEmployeeId = await createEmployee(orgId, input);
    await maybeAddCompensation(orgId, createdEmployeeId, employeeId, formData);

    revalidatePath("/employees");
    revalidatePath(`/employees/${createdEmployeeId}`);
    revalidatePath(`/employees/${createdEmployeeId}/edit`);

    redirect(`/employees/${createdEmployeeId}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create employee.",
    };
  }
}

export async function updateEmployeeAction(
  employeeId: string,
  _previousState: EmployeeFormActionState,
  formData: FormData,
): Promise<EmployeeFormActionState> {
  try {
    const { orgId, employeeId: actingEmployeeId } = await requireManagePermission();
    const input = buildEmployeeInput(formData);

    const validationError = ensureRequiredFields(input);
    if (validationError) {
      return { error: validationError };
    }

    await updateEmployee(orgId, employeeId, input);

    const requestedStatus = parseStatus(readText(formData, "employeeStatus") || "active");
    const previousStatus = parseStatus(readText(formData, "currentStatus") || "active");

    if (requestedStatus !== previousStatus || requestedStatus === "terminated" || requestedStatus === "resigned") {
      await transitionStatus(
        orgId,
        employeeId,
        requestedStatus,
        readOptionalText(formData, "endDate"),
      );
    }

    await maybeAddCompensation(orgId, employeeId, actingEmployeeId, formData);

    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);
    revalidatePath(`/employees/${employeeId}/edit`);

    redirect(`/employees/${employeeId}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to update employee.",
    };
  }
}

export async function transitionStatusAction(
  employeeId: string,
  _previousState: EmployeeFormActionState,
  formData: FormData,
): Promise<EmployeeFormActionState> {
  try {
    const { orgId } = await requireManagePermission();
    const nextStatus = parseStatus(readText(formData, "employeeStatus") || "active");

    await transitionStatus(
      orgId,
      employeeId,
      nextStatus,
      readOptionalText(formData, "endDate"),
    );

    revalidatePath("/employees");
    revalidatePath(`/employees/${employeeId}`);
    revalidatePath(`/employees/${employeeId}/edit`);

    redirect(`/employees/${employeeId}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to update employee status.",
    };
  }
}

export async function sendInviteAction(formData: FormData): Promise<void> {
  const employeeId = readText(formData, "employeeId");
  const email = readText(formData, "email");
  const returnPath = readText(formData, "returnPath") || `/employees/${employeeId}`;

  let destination = returnPath;

  try {
    if (!employeeId || !email) {
      throw new Error("Employee id and email are required.");
    }

    const context = await getViewerContext();
    if (!isOrgAdmin(context.memberRole)) {
      throw new Error("Only owner and admin members can send invites.");
    }

    await sendInvite(context.orgId, employeeId, email, context.employeeId);

    revalidatePath(`/employees/${employeeId}`);
    revalidatePath("/employees");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to send invite right now.";
    destination = `${returnPath}${returnPath.includes("?") ? "&" : "?"}inviteError=${encodeURIComponent(message)}`;
  }

  redirect(destination);
}

export async function revokeInviteAction(formData: FormData): Promise<void> {
  const employeeId = readText(formData, "employeeId");
  const inviteId = readText(formData, "inviteId");
  const returnPath = readText(formData, "returnPath") || `/employees/${employeeId}`;

  let destination = returnPath;

  try {
    if (!employeeId || !inviteId) {
      throw new Error("Invite id is required.");
    }

    const context = await getViewerContext();
    if (!isOrgAdmin(context.memberRole)) {
      throw new Error("Only owner and admin members can revoke invites.");
    }

    await revokeInvite(context.orgId, inviteId);

    revalidatePath(`/employees/${employeeId}`);
    revalidatePath("/employees");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to revoke invite right now.";
    destination = `${returnPath}${returnPath.includes("?") ? "&" : "?"}inviteError=${encodeURIComponent(message)}`;
  }

  redirect(destination);
}
