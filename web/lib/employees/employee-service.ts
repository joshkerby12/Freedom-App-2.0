import { createClient } from "@/lib/supabase/server";
import type { PermissionKey } from "@/lib/employees/permission-keys";

export const EMPLOYMENT_TYPES = [
  "full_time",
  "part_time",
  "temporary",
  "temp_agency",
  "contractor",
  "seasonal",
] as const;

export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export const EMPLOYEE_STATUSES = ["active", "on_leave", "terminated", "resigned"] as const;

export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export type EmployeeStatusFilter = "all" | "active" | "on_leave" | "terminated";

export const PAY_TYPES = ["hourly", "salary"] as const;

export type PayType = (typeof PAY_TYPES)[number];

export type ViewerContext = {
  orgId: string;
  userId: string;
  memberRole: string;
  employeeId: string | null;
};

export type RoleOption = {
  id: string;
  name: string;
  isSystem: boolean;
  sortOrder: number;
};

export type EmployeeListItem = {
  id: string;
  roleId: string;
  roleName: string;
  firstName: string;
  lastName: string;
  displayName: string;
  employmentType: string | null;
  employeeStatus: EmployeeStatus;
  email: string | null;
};

export type EmployeeInviteRecord = {
  id: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invitedAt: string | null;
  acceptedAt: string | null;
  expiresAt: string;
};

export type EmployeeCompensationRecord = {
  id: string;
  payType: PayType;
  payRate: number;
  effectiveDate: string;
  endDate: string | null;
  reason: string | null;
  createdAt: string;
};

export type EmployeeCustomField = {
  id: string;
  name: string;
  fieldType: string;
  value: string | null;
};

export type EmployeeDetailRecord = {
  id: string;
  orgId: string;
  roleId: string;
  roleName: string;
  crewName: string | null;
  supabaseAuthUid: string | null;
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
  crewId: string | null;
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
  createdAt: string | null;
  updatedAt: string | null;
  latestInvite: EmployeeInviteRecord | null;
  compensationHistory: EmployeeCompensationRecord[];
  customFields: EmployeeCustomField[];
};

export type EmployeeFilters = {
  search?: string;
  status?: EmployeeStatusFilter;
};

export type EmployeeWriteInput = {
  roleId: string;
  firstName: string;
  lastName: string;
  displayName?: string | null;
  personalEmail?: string | null;
  companyEmail?: string | null;
  phone?: string | null;
  address?: string | null;
  birthday?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  employeeTitle?: string | null;
  employeePosition?: string | null;
  employmentType?: EmploymentType | null;
  employeeStatus?: EmployeeStatus | null;
  crewId?: string | null;
  onVehicleInsurance?: boolean;
  hasCompanyCard?: boolean;
  companyCardLastFour?: string | null;
  isSales?: boolean;
  tracksHours?: boolean;
  driversLicenseNumber?: string | null;
  driversLicenseState?: string | null;
  driversLicenseClass?: string | null;
  driversLicenseExpiry?: string | null;
  medicalCardExpiry?: string | null;
};

export type AddCompensationInput = {
  payType: PayType;
  payRate: number;
  effectiveDate: string;
  endDate?: string | null;
  reason?: string | null;
  createdBy?: string | null;
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

function readNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function dateOnly(value: unknown): string | null {
  const raw = readOptionalString(value);
  if (!raw) {
    return null;
  }

  return raw.length >= 10 ? raw.slice(0, 10) : raw;
}

function normalizeSearchValue(search: string): string {
  return search.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
}

function displayNameFromRow(row: Record<string, unknown>): string {
  const displayName = readOptionalString(row.display_name);
  if (displayName) {
    return displayName;
  }

  const firstName = readRequiredString(row.first_name);
  const lastName = readRequiredString(row.last_name);
  return `${firstName} ${lastName}`.trim() || "Unnamed employee";
}

function mapInvite(row: Record<string, unknown>): EmployeeInviteRecord {
  const statusValue = readRequiredString(row.status, "pending");
  const status: EmployeeInviteRecord["status"] =
    statusValue === "accepted" ||
    statusValue === "expired" ||
    statusValue === "revoked"
      ? statusValue
      : "pending";

  return {
    id: String(row.id),
    email: readRequiredString(row.email),
    token: readRequiredString(row.token),
    status,
    invitedAt: readOptionalString(row.invited_at),
    acceptedAt: readOptionalString(row.accepted_at),
    expiresAt: readRequiredString(row.expires_at),
  };
}

function mapCompensationRow(row: Record<string, unknown>): EmployeeCompensationRecord {
  const payTypeValue = readRequiredString(row.pay_type, "hourly");
  const payType: PayType = payTypeValue === "salary" ? "salary" : "hourly";

  return {
    id: String(row.id),
    payType,
    payRate: readNumber(row.pay_rate),
    effectiveDate: dateOnly(row.effective_date) ?? "",
    endDate: dateOnly(row.end_date),
    reason: readOptionalString(row.reason),
    createdAt: readRequiredString(row.created_at),
  };
}

function mapEmployeePayload(input: EmployeeWriteInput): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    role_id: input.roleId,
    first_name: input.firstName.trim(),
    last_name: input.lastName.trim(),
    display_name: readOptionalString(input.displayName),
    personal_email: readOptionalString(input.personalEmail),
    company_email: readOptionalString(input.companyEmail),
    phone: readOptionalString(input.phone),
    address: readOptionalString(input.address),
    birthday: dateOnly(input.birthday),
    start_date: dateOnly(input.startDate),
    end_date: dateOnly(input.endDate),
    employee_title: readOptionalString(input.employeeTitle),
    employee_position: readOptionalString(input.employeePosition),
    employment_type: input.employmentType ?? null,
    employee_status: input.employeeStatus ?? null,
    crew_id: readOptionalString(input.crewId),
    on_vehicle_insurance: input.onVehicleInsurance ?? false,
    has_company_card: input.hasCompanyCard ?? false,
    company_card_last_four: readOptionalString(input.companyCardLastFour),
    is_sales: input.isSales ?? false,
    tracks_hours: input.tracksHours ?? true,
    drivers_license_number: readOptionalString(input.driversLicenseNumber),
    drivers_license_state: readOptionalString(input.driversLicenseState),
    drivers_license_class: readOptionalString(input.driversLicenseClass),
    drivers_license_expiry: dateOnly(input.driversLicenseExpiry),
    medical_card_expiry: dateOnly(input.medicalCardExpiry),
  };

  if (!payload.has_company_card) {
    payload.company_card_last_four = null;
  }

  return payload;
}

async function assertNoError(
  error: { message: string } | null,
  context: string,
): Promise<void> {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

export async function getViewerContext(): Promise<ViewerContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  await assertNoError(userError, "Failed to read session user");

  if (!user) {
    throw new Error("You must be signed in.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id,role")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  await assertNoError(membershipError, "Failed to resolve organization membership");

  const orgId = readOptionalString(membership?.org_id);
  if (!orgId) {
    throw new Error("No organization membership found for this account.");
  }

  const { data: employee, error: employeeError } = await supabase
    .from("employees")
    .select("id")
    .eq("org_id", orgId)
    .eq("supabase_auth_uid", user.id)
    .limit(1)
    .maybeSingle();

  await assertNoError(employeeError, "Failed to resolve employee identity");

  return {
    orgId,
    userId: user.id,
    memberRole: readRequiredString(membership?.role, "member"),
    employeeId: readOptionalString(employee?.id),
  };
}

export function isOrgAdmin(memberRole: string): boolean {
  return memberRole === "owner" || memberRole === "admin";
}

export async function resolvePermission(
  orgId: string,
  employeeId: string | null,
  permissionKey: PermissionKey,
): Promise<boolean> {
  if (!employeeId) {
    return false;
  }

  const supabase = await createClient();

  const { data: overrideRow, error: overrideError } = await supabase
    .from("employee_permission_overrides")
    .select("granted")
    .eq("org_id", orgId)
    .eq("employee_id", employeeId)
    .eq("permission_key", permissionKey)
    .limit(1)
    .maybeSingle();

  await assertNoError(overrideError, "Failed to read permission override");

  if (typeof overrideRow?.granted === "boolean") {
    return overrideRow.granted;
  }

  const { data: employeeRow, error: employeeError } = await supabase
    .from("employees")
    .select("role_id")
    .eq("org_id", orgId)
    .eq("id", employeeId)
    .limit(1)
    .maybeSingle();

  await assertNoError(employeeError, "Failed to resolve employee role");

  const roleId = readOptionalString(employeeRow?.role_id);
  if (!roleId) {
    return false;
  }

  const { data: rolePermission, error: rolePermissionError } = await supabase
    .from("role_permissions")
    .select("granted")
    .eq("org_id", orgId)
    .eq("role_id", roleId)
    .eq("permission_key", permissionKey)
    .limit(1)
    .maybeSingle();

  await assertNoError(rolePermissionError, "Failed to read role permission");

  return rolePermission?.granted === true;
}

export async function getEmployees(
  orgId: string,
  filters: EmployeeFilters = {},
): Promise<EmployeeListItem[]> {
  const supabase = await createClient();
  const search = normalizeSearchValue(filters.search ?? "");
  const status = filters.status ?? "active";

  let query = supabase
    .from("employees")
    .select("id,role_id,first_name,last_name,display_name,employment_type,employee_status,company_email,personal_email")
    .eq("org_id", orgId);

  if (status === "active") {
    query = query.eq("employee_status", "active");
  } else if (status === "on_leave") {
    query = query.eq("employee_status", "on_leave");
  } else if (status === "terminated") {
    query = query.in("employee_status", ["terminated", "resigned"]);
  }

  if (search) {
    const escaped = search.replace(/,/g, " ");
    query = query.or(
      `first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,display_name.ilike.%${escaped}%`,
    );
  }

  const { data, error } = await query
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  await assertNoError(error, "Failed to load employees");

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const roleIds = Array.from(
    new Set(rows.map((row) => readOptionalString(row.role_id)).filter((value): value is string => Boolean(value))),
  );

  const roleNameById = new Map<string, string>();
  if (roleIds.length) {
    const { data: roleRows, error: roleError } = await supabase
      .from("roles")
      .select("id,name")
      .eq("org_id", orgId)
      .in("id", roleIds);

    await assertNoError(roleError, "Failed to load role names");

    for (const roleRow of (roleRows ?? []) as Array<Record<string, unknown>>) {
      roleNameById.set(String(roleRow.id), readRequiredString(roleRow.name, "Unknown role"));
    }
  }

  return rows.map((row) => {
    const statusValue = readRequiredString(row.employee_status, "active");
    const employeeStatus: EmployeeStatus =
      statusValue === "on_leave" || statusValue === "terminated" || statusValue === "resigned"
        ? statusValue
        : "active";

    const roleId = readRequiredString(row.role_id);

    return {
      id: String(row.id),
      roleId,
      roleName: roleNameById.get(roleId) ?? "Unknown role",
      firstName: readRequiredString(row.first_name),
      lastName: readRequiredString(row.last_name),
      displayName: displayNameFromRow(row),
      employmentType: readOptionalString(row.employment_type),
      employeeStatus,
      email: readOptionalString(row.company_email) ?? readOptionalString(row.personal_email),
    };
  });
}

export async function getEmployee(
  orgId: string,
  employeeId: string,
  options: { includeCompensation?: boolean } = {},
): Promise<EmployeeDetailRecord | null> {
  const supabase = await createClient();

  const { data: employeeRow, error: employeeError } = await supabase
    .from("employees")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", employeeId)
    .limit(1)
    .maybeSingle();

  await assertNoError(employeeError, "Failed to load employee");

  if (!employeeRow) {
    return null;
  }

  const roleId = readRequiredString(employeeRow.role_id);
  const crewId = readOptionalString(employeeRow.crew_id);

  const [roleResult, crewResult, inviteResult, customDefinitionResult, compensationResult] = await Promise.all([
    supabase.from("roles").select("name").eq("org_id", orgId).eq("id", roleId).limit(1).maybeSingle(),
    crewId
      ? supabase.from("crews").select("name").eq("org_id", orgId).eq("id", crewId).limit(1).maybeSingle()
      : Promise.resolve({ data: null, error: null }),
    supabase
      .from("employee_invites")
      .select("id,email,token,status,invited_at,accepted_at,expires_at")
      .eq("org_id", orgId)
      .eq("employee_id", employeeId)
      .order("invited_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("custom_field_definitions")
      .select("id,name,field_type,sort_order")
      .eq("org_id", orgId)
      .eq("entity_type", "employee")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    options.includeCompensation
      ? supabase
          .from("employee_compensation")
          .select("id,pay_type,pay_rate,effective_date,end_date,reason,created_at")
          .eq("org_id", orgId)
          .eq("employee_id", employeeId)
          .order("effective_date", { ascending: false })
      : Promise.resolve({ data: [], error: null }),
  ]);

  await Promise.all([
    assertNoError(roleResult.error, "Failed to load role"),
    assertNoError(crewResult.error, "Failed to load crew"),
    assertNoError(inviteResult.error, "Failed to load invite status"),
    assertNoError(customDefinitionResult.error, "Failed to load custom field definitions"),
    assertNoError(compensationResult.error, "Failed to load compensation history"),
  ]);

  const definitions = (customDefinitionResult.data ?? []) as Array<Record<string, unknown>>;

  const customFields: EmployeeCustomField[] = [];
  if (definitions.length) {
    const definitionIds = definitions.map((definition) => String(definition.id));

    const { data: valueRows, error: valueError } = await supabase
      .from("custom_field_values")
      .select(
        "custom_field_definition_id,value_boolean,value_enum,value_text,value_date,value_number,file_url",
      )
      .eq("org_id", orgId)
      .eq("entity_type", "employee")
      .eq("entity_id", employeeId)
      .in("custom_field_definition_id", definitionIds);

    await assertNoError(valueError, "Failed to load custom field values");

    const valueMap = new Map<string, Record<string, unknown>>();
    for (const row of (valueRows ?? []) as Array<Record<string, unknown>>) {
      valueMap.set(String(row.custom_field_definition_id), row);
    }

    for (const definition of definitions) {
      const definitionId = String(definition.id);
      const value = valueMap.get(definitionId);
      const fieldType = readRequiredString(definition.field_type, "text");

      let normalizedValue: string | null = null;

      if (value) {
        if (fieldType === "boolean") {
          normalizedValue = typeof value.value_boolean === "boolean" ? (value.value_boolean ? "Yes" : "No") : null;
        } else if (fieldType === "enum" || fieldType === "file_enum") {
          normalizedValue = readOptionalString(value.value_enum);
        } else if (fieldType === "date") {
          normalizedValue = dateOnly(value.value_date);
        } else if (fieldType === "number") {
          normalizedValue = value.value_number == null ? null : String(value.value_number);
        } else if (fieldType === "file") {
          normalizedValue = readOptionalString(value.file_url);
        } else {
          normalizedValue = readOptionalString(value.value_text);
        }
      }

      customFields.push({
        id: definitionId,
        name: readRequiredString(definition.name),
        fieldType,
        value: normalizedValue,
      });
    }
  }

  const statusValue = readRequiredString(employeeRow.employee_status, "active");
  const employeeStatus: EmployeeStatus =
    statusValue === "on_leave" || statusValue === "terminated" || statusValue === "resigned"
      ? statusValue
      : "active";

  return {
    id: String(employeeRow.id),
    orgId: readRequiredString(employeeRow.org_id),
    roleId,
    roleName: readRequiredString(roleResult.data?.name, "Unknown role"),
    crewName: readOptionalString(crewResult.data?.name),
    supabaseAuthUid: readOptionalString(employeeRow.supabase_auth_uid),
    firstName: readRequiredString(employeeRow.first_name),
    lastName: readRequiredString(employeeRow.last_name),
    displayName: displayNameFromRow(employeeRow as Record<string, unknown>),
    personalEmail: readOptionalString(employeeRow.personal_email),
    companyEmail: readOptionalString(employeeRow.company_email),
    phone: readOptionalString(employeeRow.phone),
    address: readOptionalString(employeeRow.address),
    birthday: dateOnly(employeeRow.birthday),
    startDate: dateOnly(employeeRow.start_date),
    endDate: dateOnly(employeeRow.end_date),
    employeeTitle: readOptionalString(employeeRow.employee_title),
    employeePosition: readOptionalString(employeeRow.employee_position),
    employmentType: readOptionalString(employeeRow.employment_type),
    employeeStatus,
    crewId,
    onVehicleInsurance: readBoolean(employeeRow.on_vehicle_insurance),
    hasCompanyCard: readBoolean(employeeRow.has_company_card),
    companyCardLastFour: readOptionalString(employeeRow.company_card_last_four),
    isSales: readBoolean(employeeRow.is_sales),
    tracksHours: readBoolean(employeeRow.tracks_hours),
    driversLicenseNumber: readOptionalString(employeeRow.drivers_license_number),
    driversLicenseState: readOptionalString(employeeRow.drivers_license_state),
    driversLicenseClass: readOptionalString(employeeRow.drivers_license_class),
    driversLicenseExpiry: dateOnly(employeeRow.drivers_license_expiry),
    medicalCardExpiry: dateOnly(employeeRow.medical_card_expiry),
    createdAt: readOptionalString(employeeRow.created_at),
    updatedAt: readOptionalString(employeeRow.updated_at),
    latestInvite: inviteResult.data ? mapInvite(inviteResult.data as Record<string, unknown>) : null,
    compensationHistory: ((compensationResult.data ?? []) as Array<Record<string, unknown>>).map(mapCompensationRow),
    customFields,
  };
}

export async function createEmployee(orgId: string, data: EmployeeWriteInput): Promise<string> {
  const supabase = await createClient();
  const payload = mapEmployeePayload(data);

  const { data: createdEmployee, error } = await supabase
    .from("employees")
    .insert({
      ...payload,
      org_id: orgId,
    })
    .select("id")
    .single();

  await assertNoError(error, "Failed to create employee");

  return String(createdEmployee.id);
}

export async function updateEmployee(
  orgId: string,
  employeeId: string,
  data: EmployeeWriteInput,
): Promise<void> {
  const supabase = await createClient();
  const payload = mapEmployeePayload(data);

  const { error } = await supabase
    .from("employees")
    .update(payload)
    .eq("org_id", orgId)
    .eq("id", employeeId);

  await assertNoError(error, "Failed to update employee");
}

export async function transitionStatus(
  orgId: string,
  employeeId: string,
  status: EmployeeStatus,
  endDate?: string | null,
): Promise<void> {
  const supabase = await createClient();

  const updates: Record<string, string | null> = {
    employee_status: status,
  };

  if (status === "terminated" || status === "resigned") {
    updates.end_date = dateOnly(endDate) ?? dateOnly(new Date().toISOString());
  } else {
    updates.end_date = null;
  }

  const { error } = await supabase
    .from("employees")
    .update(updates)
    .eq("org_id", orgId)
    .eq("id", employeeId);

  await assertNoError(error, "Failed to update employee status");
}

export async function addCompensation(
  orgId: string,
  employeeId: string,
  input: AddCompensationInput,
): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase.from("employee_compensation").insert({
    org_id: orgId,
    employee_id: employeeId,
    pay_type: input.payType,
    pay_rate: input.payRate,
    effective_date: dateOnly(input.effectiveDate),
    end_date: dateOnly(input.endDate),
    reason: readOptionalString(input.reason),
    created_by: readOptionalString(input.createdBy),
  });

  await assertNoError(error, "Failed to save compensation");
}

export async function requirePermission(permissionKey: PermissionKey): Promise<ViewerContext> {
  const context = await getViewerContext();
  const granted = await resolvePermission(context.orgId, context.employeeId, permissionKey);
  if (!granted) {
    throw new Error("You do not have permission for this action.");
  }

  return context;
}

export function statusLabel(status: EmployeeStatus): string {
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

export function employmentTypeLabel(value: string | null): string {
  if (!value) {
    return "—";
  }

  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function suggestedDisplayName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ").trim();
}

export function isTerminalStatus(status: EmployeeStatus): boolean {
  return status === "terminated" || status === "resigned";
}
