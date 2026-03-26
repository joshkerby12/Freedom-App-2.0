import type { SupabaseClient } from "@supabase/supabase-js";

type AppSupabaseClient = SupabaseClient;

type OrgMembershipRow = {
  org_id: string;
};

type CrewRow = {
  id: string;
  org_id: string;
  name: string;
  crew_lead_id: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

type EmployeeRow = {
  id: string;
  org_id: string;
  role_id: string | null;
  crew_id: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  employee_title: string | null;
  employment_type: string | null;
  employee_status: string | null;
};

type RoleRow = {
  id: string;
  name: string;
};

type OrgContext = {
  orgId: string;
};

export type CrewListItem = {
  id: string;
  name: string;
  isActive: boolean;
  notes: string | null;
  crewLeadName: string | null;
  memberCount: number;
};

export type CrewMember = {
  id: string;
  displayName: string;
  roleName: string | null;
  employmentType: string | null;
  employeeStatus: string | null;
  employeeTitle: string | null;
};

export type CrewDetail = {
  id: string;
  name: string;
  isActive: boolean;
  notes: string | null;
  crewLead: CrewMember | null;
  members: CrewMember[];
};

export type CrewLeadOption = {
  id: string;
  label: string;
  roleName: string | null;
};

export type CrewUpsertInput = {
  name: string;
  crewLeadId: string | null;
  isActive: boolean;
  notes: string | null;
};

async function getOrgContext(supabase: AppSupabaseClient): Promise<OrgContext> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(`Unable to verify your session: ${userError.message}`);
  }

  if (!user) {
    throw new Error("Authentication required.");
  }

  const { data, error } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle<OrgMembershipRow>();

  if (error) {
    throw new Error(`Unable to resolve your organization: ${error.message}`);
  }

  if (!data?.org_id) {
    throw new Error("No organization membership found for this account.");
  }

  return { orgId: data.org_id };
}

function getEmployeeDisplayName(employee: Pick<EmployeeRow, "display_name" | "first_name" | "last_name">): string {
  const displayName = employee.display_name?.trim();
  if (displayName) {
    return displayName;
  }

  const first = employee.first_name?.trim() ?? "";
  const last = employee.last_name?.trim() ?? "";
  const combined = `${first} ${last}`.trim();
  return combined || "Unnamed employee";
}

function normalizeOptionalText(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function getRoleNameMap(
  supabase: AppSupabaseClient,
  orgId: string,
  roleIds: string[],
): Promise<Map<string, string>> {
  if (roleIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("roles")
    .select("id, name")
    .eq("org_id", orgId)
    .in("id", roleIds);

  if (error) {
    throw new Error(`Unable to load role data: ${error.message}`);
  }

  const rows = (data ?? []) as RoleRow[];
  return new Map(rows.map((row) => [row.id, row.name]));
}

async function resolveCrewLeadId(
  supabase: AppSupabaseClient,
  orgId: string,
  crewLeadId: string | null,
): Promise<string | null> {
  const normalizedCrewLeadId = normalizeOptionalText(crewLeadId);
  if (!normalizedCrewLeadId) {
    return null;
  }

  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("org_id", orgId)
    .eq("id", normalizedCrewLeadId)
    .in("employee_status", ["active", "on_leave"])
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Unable to validate crew lead: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Selected crew lead is not an active employee in your organization.");
  }

  return data.id;
}

export async function listActiveCrews(supabase: AppSupabaseClient): Promise<CrewListItem[]> {
  const { orgId } = await getOrgContext(supabase);

  const { data, error } = await supabase
    .from("crews")
    .select("id, org_id, name, crew_lead_id, is_active, notes, created_at, updated_at")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Unable to load crews: ${error.message}`);
  }

  const crews = (data ?? []) as CrewRow[];
  if (crews.length === 0) {
    return [];
  }

  const crewIds = crews.map((crew) => crew.id);
  const leadIds = Array.from(
    new Set(
      crews
        .map((crew) => crew.crew_lead_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );

  const crewLeadNameById = new Map<string, string>();
  if (leadIds.length > 0) {
    const { data: leadData, error: leadError } = await supabase
      .from("employees")
      .select("id, display_name, first_name, last_name")
      .eq("org_id", orgId)
      .in("id", leadIds);

    if (leadError) {
      throw new Error(`Unable to load crew lead information: ${leadError.message}`);
    }

    const leads = (leadData ?? []) as Pick<EmployeeRow, "id" | "display_name" | "first_name" | "last_name">[];
    for (const lead of leads) {
      crewLeadNameById.set(lead.id, getEmployeeDisplayName(lead));
    }
  }

  const memberCountByCrewId = new Map<string, number>();
  const { data: memberRows, error: memberError } = await supabase
    .from("employees")
    .select("id, crew_id")
    .eq("org_id", orgId)
    .in("crew_id", crewIds)
    .in("employee_status", ["active", "on_leave"]);

  if (memberError) {
    throw new Error(`Unable to load crew member counts: ${memberError.message}`);
  }

  for (const row of (memberRows ?? []) as Pick<EmployeeRow, "id" | "crew_id">[]) {
    if (!row.crew_id) {
      continue;
    }

    const currentCount = memberCountByCrewId.get(row.crew_id) ?? 0;
    memberCountByCrewId.set(row.crew_id, currentCount + 1);
  }

  return crews.map((crew) => ({
    id: crew.id,
    name: crew.name,
    isActive: crew.is_active,
    notes: crew.notes,
    crewLeadName: crew.crew_lead_id ? (crewLeadNameById.get(crew.crew_lead_id) ?? null) : null,
    memberCount: memberCountByCrewId.get(crew.id) ?? 0,
  }));
}

export async function getCrewDetail(
  supabase: AppSupabaseClient,
  crewId: string,
): Promise<CrewDetail | null> {
  const { orgId } = await getOrgContext(supabase);

  const { data, error } = await supabase
    .from("crews")
    .select("id, org_id, name, crew_lead_id, is_active, notes, created_at, updated_at")
    .eq("org_id", orgId)
    .eq("id", crewId)
    .limit(1)
    .maybeSingle<CrewRow>();

  if (error) {
    throw new Error(`Unable to load crew details: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  const { data: memberData, error: memberError } = await supabase
    .from("employees")
    .select(
      "id, org_id, role_id, crew_id, display_name, first_name, last_name, employee_title, employment_type, employee_status",
    )
    .eq("org_id", orgId)
    .eq("crew_id", data.id)
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });

  if (memberError) {
    throw new Error(`Unable to load crew members: ${memberError.message}`);
  }

  const members = (memberData ?? []) as EmployeeRow[];
  const roleIds = Array.from(
    new Set(
      [
        ...members.map((member) => member.role_id),
      ].filter((roleId): roleId is string => Boolean(roleId)),
    ),
  );

  let crewLead: CrewMember | null = null;
  if (data.crew_lead_id) {
    const { data: crewLeadRow, error: crewLeadError } = await supabase
      .from("employees")
      .select(
        "id, org_id, role_id, crew_id, display_name, first_name, last_name, employee_title, employment_type, employee_status",
      )
      .eq("org_id", orgId)
      .eq("id", data.crew_lead_id)
      .limit(1)
      .maybeSingle<EmployeeRow>();

    if (crewLeadError) {
      throw new Error(`Unable to load crew lead: ${crewLeadError.message}`);
    }

    if (crewLeadRow) {
      roleIds.push(...(crewLeadRow.role_id ? [crewLeadRow.role_id] : []));
      crewLead = {
        id: crewLeadRow.id,
        displayName: getEmployeeDisplayName(crewLeadRow),
        roleName: null,
        employmentType: crewLeadRow.employment_type,
        employeeStatus: crewLeadRow.employee_status,
        employeeTitle: crewLeadRow.employee_title,
      };
    }
  }

  const roleNameById = await getRoleNameMap(
    supabase,
    orgId,
    Array.from(new Set(roleIds.filter((roleId): roleId is string => Boolean(roleId)))),
  );

  if (crewLead?.id) {
    const matchingLead = members.find((member) => member.id === crewLead?.id);
    const leadRoleId = matchingLead?.role_id ?? null;
    crewLead = {
      ...crewLead,
      roleName: leadRoleId ? (roleNameById.get(leadRoleId) ?? null) : null,
    };
  }

  const normalizedMembers: CrewMember[] = members.map((member) => ({
    id: member.id,
    displayName: getEmployeeDisplayName(member),
    roleName: member.role_id ? (roleNameById.get(member.role_id) ?? null) : null,
    employmentType: member.employment_type,
    employeeStatus: member.employee_status,
    employeeTitle: member.employee_title,
  }));

  return {
    id: data.id,
    name: data.name,
    isActive: data.is_active,
    notes: data.notes,
    crewLead,
    members: normalizedMembers,
  };
}

export async function listCrewLeadOptions(
  supabase: AppSupabaseClient,
): Promise<CrewLeadOption[]> {
  const { orgId } = await getOrgContext(supabase);

  const { data, error } = await supabase
    .from("employees")
    .select(
      "id, org_id, role_id, crew_id, display_name, first_name, last_name, employee_title, employment_type, employee_status",
    )
    .eq("org_id", orgId)
    .in("employee_status", ["active", "on_leave"])
    .order("first_name", { ascending: true })
    .order("last_name", { ascending: true });

  if (error) {
    throw new Error(`Unable to load crew lead options: ${error.message}`);
  }

  const employees = (data ?? []) as EmployeeRow[];
  const roleIds = Array.from(
    new Set(
      employees
        .map((employee) => employee.role_id)
        .filter((roleId): roleId is string => Boolean(roleId)),
    ),
  );
  const roleNameById = await getRoleNameMap(supabase, orgId, roleIds);

  return employees
    .map((employee) => ({
      id: employee.id,
      label: getEmployeeDisplayName(employee),
      roleName: employee.role_id ? (roleNameById.get(employee.role_id) ?? null) : null,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export async function createCrew(
  supabase: AppSupabaseClient,
  input: CrewUpsertInput,
): Promise<string> {
  const { orgId } = await getOrgContext(supabase);

  const normalizedName = input.name.trim();
  if (!normalizedName) {
    throw new Error("Crew name is required.");
  }

  const crewLeadId = await resolveCrewLeadId(supabase, orgId, input.crewLeadId);
  const { data, error } = await supabase
    .from("crews")
    .insert({
      org_id: orgId,
      name: normalizedName,
      crew_lead_id: crewLeadId,
      is_active: input.isActive,
      notes: normalizeOptionalText(input.notes),
    })
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Unable to create crew: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Crew was created, but no id was returned.");
  }

  return data.id;
}

export async function updateCrew(
  supabase: AppSupabaseClient,
  crewId: string,
  input: CrewUpsertInput,
): Promise<void> {
  const { orgId } = await getOrgContext(supabase);

  const normalizedName = input.name.trim();
  if (!normalizedName) {
    throw new Error("Crew name is required.");
  }

  const crewLeadId = await resolveCrewLeadId(supabase, orgId, input.crewLeadId);
  const { data, error } = await supabase
    .from("crews")
    .update({
      name: normalizedName,
      crew_lead_id: crewLeadId,
      is_active: input.isActive,
      notes: normalizeOptionalText(input.notes),
      updated_at: new Date().toISOString(),
    })
    .eq("org_id", orgId)
    .eq("id", crewId)
    .select("id")
    .limit(1)
    .maybeSingle<{ id: string }>();

  if (error) {
    throw new Error(`Unable to update crew: ${error.message}`);
  }

  if (!data?.id) {
    throw new Error("Crew not found or you do not have permission to edit it.");
  }
}
