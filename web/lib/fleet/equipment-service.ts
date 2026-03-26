import { getEquipmentExpirySummary } from "@/lib/fleet/expiry";
import type { EquipmentUpsertInput } from "@/lib/fleet/equipment-form-data";
import { requireOrgContext } from "@/lib/fleet/org-context";
import type {
  EquipmentAssignmentRecord,
  EquipmentDetail,
  EquipmentMaintenanceRecord,
  EquipmentRecord,
  EquipmentScheduleRecord,
  EquipmentType,
  EquipmentWithExpiry,
  VehicleInspectionRecord,
} from "@/lib/fleet/types";

export type EquipmentListFilters = {
  search?: string;
  type?: EquipmentType | "all";
  hasExpiryAlert?: boolean;
  inactiveOnly?: boolean;
  includeInactive?: boolean;
};

function normalizeNullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function normalizeNullableNumber(value: unknown): number | null {
  return typeof value === "number" ? value : null;
}

function crewNameFromJoin(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0] as { name?: unknown } | undefined;
    return typeof first?.name === "string" ? first.name : null;
  }

  if (value && typeof value === "object" && "name" in value) {
    const name = (value as { name?: unknown }).name;
    return typeof name === "string" ? name : null;
  }

  return null;
}

function mapEquipmentRow(row: Record<string, unknown>): EquipmentWithExpiry {
  const equipment: EquipmentRecord = {
    id: String(row.id),
    org_id: String(row.org_id),
    name: String(row.name),
    type: row.type as EquipmentType,
    make: normalizeNullableString(row.make),
    model: normalizeNullableString(row.model),
    year: normalizeNullableNumber(row.year),
    vin_serial: normalizeNullableString(row.vin_serial),
    license_plate: normalizeNullableString(row.license_plate),
    dot_number: normalizeNullableString(row.dot_number),
    registration_expiry: normalizeNullableString(row.registration_expiry),
    insurance_expiry: normalizeNullableString(row.insurance_expiry),
    annual_inspection_due: normalizeNullableString(row.annual_inspection_due),
    is_shareable: Boolean(row.is_shareable),
    is_active: Boolean(row.is_active),
    notes: normalizeNullableString(row.notes),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };

  return {
    ...equipment,
    expiry: getEquipmentExpirySummary(equipment),
  };
}

function mapAssignmentRow(row: Record<string, unknown>): EquipmentAssignmentRecord {
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    equipment_id: String(row.equipment_id),
    crew_id: String(row.crew_id),
    assigned_date: String(row.assigned_date),
    notes: normalizeNullableString(row.notes),
    crew_name: crewNameFromJoin(row.crews),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapScheduleRow(row: Record<string, unknown>): EquipmentScheduleRecord {
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    equipment_id: String(row.equipment_id),
    crew_id: normalizeNullableString(row.crew_id),
    start_date: String(row.start_date),
    end_date: normalizeNullableString(row.end_date),
    notes: normalizeNullableString(row.notes),
    crew_name: crewNameFromJoin(row.crews),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapMaintenanceRow(row: Record<string, unknown>): EquipmentMaintenanceRecord {
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    equipment_id: String(row.equipment_id),
    type: String(row.type),
    performed_date: String(row.performed_date),
    mileage: normalizeNullableNumber(row.mileage),
    next_service_date: normalizeNullableString(row.next_service_date),
    next_service_mileage: normalizeNullableNumber(row.next_service_mileage),
    performed_by: normalizeNullableString(row.performed_by),
    cost: normalizeNullableNumber(row.cost),
    notes: normalizeNullableString(row.notes),
    receipt_url: normalizeNullableString(row.receipt_url),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function driverNameFromJoin(value: unknown): string | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const employee = value as {
    display_name?: unknown;
    first_name?: unknown;
    last_name?: unknown;
  };

  if (typeof employee.display_name === "string" && employee.display_name.trim()) {
    return employee.display_name.trim();
  }

  const first = typeof employee.first_name === "string" ? employee.first_name.trim() : "";
  const last = typeof employee.last_name === "string" ? employee.last_name.trim() : "";
  const combined = `${first} ${last}`.trim();

  return combined || null;
}

function mapInspectionRow(row: Record<string, unknown>): VehicleInspectionRecord {
  const defects = Array.isArray(row.defects)
    ? row.defects.filter((item): item is string => typeof item === "string")
    : null;

  return {
    id: String(row.id),
    org_id: String(row.org_id),
    equipment_id: String(row.equipment_id),
    driver_id: String(row.driver_id),
    inspection_type: row.inspection_type as "pre_trip" | "post_trip",
    inspection_date: String(row.inspection_date),
    odometer: normalizeNullableNumber(row.odometer),
    passed: Boolean(row.passed),
    defects,
    driver_signature: normalizeNullableString(row.driver_signature),
    notes: normalizeNullableString(row.notes),
    driver_name: driverNameFromJoin(row.employees),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function escapeForIlike(value: string): string {
  return value
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replaceAll(",", " ")
    .trim();
}

function toNullable(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

function toDateOnlyYmd(input: Date): string {
  return input.toISOString().split("T")[0];
}

export async function listEquipment(
  filters: EquipmentListFilters = {},
): Promise<EquipmentWithExpiry[]> {
  const { supabase, orgId } = await requireOrgContext();

  let query = supabase.from("equipment").select("*").eq("org_id", orgId);

  if (filters.type && filters.type !== "all") {
    query = query.eq("type", filters.type);
  }

  if (filters.inactiveOnly) {
    query = query.eq("is_active", false);
  } else if (!filters.includeInactive) {
    query = query.eq("is_active", true);
  }

  if (filters.search?.trim()) {
    const search = escapeForIlike(filters.search);
    query = query.or(
      `name.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%,vin_serial.ilike.%${search}%,license_plate.ilike.%${search}%`,
    );
  }

  const { data, error } = await query.order("type", { ascending: true }).order("name", {
    ascending: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const equipment = rows.map(mapEquipmentRow);

  if (!filters.hasExpiryAlert) {
    return equipment;
  }

  return equipment.filter((item) => item.expiry.hasAlert);
}

export async function getEquipmentById(
  equipmentId: string,
): Promise<EquipmentWithExpiry | null> {
  const { supabase, orgId } = await requireOrgContext();

  const { data, error } = await supabase
    .from("equipment")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", equipmentId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  return mapEquipmentRow(data as Record<string, unknown>);
}

export async function getEquipmentDetail(
  equipmentId: string,
): Promise<EquipmentDetail | null> {
  const { supabase, orgId } = await requireOrgContext();

  const equipment = await getEquipmentById(equipmentId);
  if (!equipment) {
    return null;
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("equipment_assignments")
    .select("id,org_id,equipment_id,crew_id,assigned_date,notes,created_at,updated_at,crews(name)")
    .eq("org_id", orgId)
    .eq("equipment_id", equipmentId)
    .order("assigned_date", { ascending: false });

  if (assignmentError) {
    throw new Error(assignmentError.message);
  }

  const { data: scheduleRows, error: scheduleError } = await supabase
    .from("equipment_schedule")
    .select("id,org_id,equipment_id,crew_id,start_date,end_date,notes,created_at,updated_at,crews(name)")
    .eq("org_id", orgId)
    .eq("equipment_id", equipmentId)
    .order("start_date", { ascending: true });

  if (scheduleError) {
    throw new Error(scheduleError.message);
  }

  const { data: maintenanceRows, error: maintenanceError } = await supabase
    .from("equipment_maintenance")
    .select("*")
    .eq("org_id", orgId)
    .eq("equipment_id", equipmentId)
    .order("performed_date", { ascending: false });

  if (maintenanceError) {
    throw new Error(maintenanceError.message);
  }

  const { data: inspectionRows, error: inspectionError } = await supabase
    .from("vehicle_inspections")
    .select("*,employees(first_name,last_name,display_name)")
    .eq("org_id", orgId)
    .eq("equipment_id", equipmentId)
    .order("inspection_date", { ascending: false });

  if (inspectionError) {
    throw new Error(inspectionError.message);
  }

  const assignments = ((assignmentRows ?? []) as Record<string, unknown>[]).map(mapAssignmentRow);
  const schedule = ((scheduleRows ?? []) as Record<string, unknown>[]).map(mapScheduleRow);
  const maintenance = ((maintenanceRows ?? []) as Record<string, unknown>[]).map(mapMaintenanceRow);
  const inspections = ((inspectionRows ?? []) as Record<string, unknown>[]).map(mapInspectionRow);

  return {
    equipment,
    assignments,
    currentAssignment: assignments[0] ?? null,
    schedule,
    maintenance,
    inspections,
  };
}

export async function createEquipment(
  input: EquipmentUpsertInput,
): Promise<EquipmentWithExpiry> {
  const { supabase, orgId } = await requireOrgContext();

  const { data, error } = await supabase
    .from("equipment")
    .insert({
      org_id: orgId,
      name: input.name,
      type: input.type,
      make: input.make,
      model: input.model,
      year: input.year,
      vin_serial: input.vin_serial,
      license_plate: input.license_plate,
      dot_number: input.dot_number,
      registration_expiry: input.registration_expiry,
      insurance_expiry: input.insurance_expiry,
      annual_inspection_due: input.annual_inspection_due,
      is_shareable: input.is_shareable,
      is_active: input.is_active,
      notes: input.notes,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapEquipmentRow(data as Record<string, unknown>);
}

export async function updateEquipment(
  equipmentId: string,
  input: EquipmentUpsertInput,
): Promise<EquipmentWithExpiry> {
  const { supabase, orgId } = await requireOrgContext();

  const { data, error } = await supabase
    .from("equipment")
    .update({
      name: input.name,
      type: input.type,
      make: input.make,
      model: input.model,
      year: input.year,
      vin_serial: input.vin_serial,
      license_plate: input.license_plate,
      dot_number: input.dot_number,
      registration_expiry: input.registration_expiry,
      insurance_expiry: input.insurance_expiry,
      annual_inspection_due: input.annual_inspection_due,
      is_shareable: input.is_shareable,
      is_active: input.is_active,
      notes: input.notes,
    })
    .eq("org_id", orgId)
    .eq("id", equipmentId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapEquipmentRow(data as Record<string, unknown>);
}

export async function checkEquipmentAvailability(input: {
  equipmentId: string;
  startDate: string;
  endDate?: string | null;
  excludeScheduleId?: string | null;
}): Promise<boolean> {
  const { supabase, orgId } = await requireOrgContext();

  const { data: equipmentRow, error: equipmentError } = await supabase
    .from("equipment")
    .select("is_active,is_shareable")
    .eq("org_id", orgId)
    .eq("id", input.equipmentId)
    .maybeSingle();

  if (equipmentError) {
    throw new Error(equipmentError.message);
  }

  if (!equipmentRow || equipmentRow.is_active === false) {
    return false;
  }

  if (equipmentRow.is_shareable === true) {
    return true;
  }

  const normalizedEndDate = toNullable(input.endDate) ?? input.startDate;

  const { data: rpcConflict, error: rpcError } = await supabase.rpc(
    "has_equipment_schedule_conflict",
    {
      check_org_id: orgId,
      check_equipment_id: input.equipmentId,
      check_start_date: input.startDate,
      check_end_date: normalizedEndDate,
      exclude_schedule_id: toNullable(input.excludeScheduleId),
    },
  );

  if (!rpcError && typeof rpcConflict === "boolean") {
    return !rpcConflict;
  }

  let overlapQuery = supabase
    .from("equipment_schedule")
    .select("id")
    .eq("org_id", orgId)
    .eq("equipment_id", input.equipmentId)
    .lte("start_date", normalizedEndDate)
    .or(`end_date.is.null,end_date.gte.${input.startDate}`);

  const excludedId = toNullable(input.excludeScheduleId);
  if (excludedId) {
    overlapQuery = overlapQuery.neq("id", excludedId);
  }

  const { data: overlaps, error: overlapError } = await overlapQuery;

  if (overlapError) {
    throw new Error(overlapError.message);
  }

  return (overlaps ?? []).length === 0;
}

export function formatDateRange(startDate: string, endDate: string | null): string {
  if (!endDate || endDate === startDate) {
    return startDate;
  }

  return `${startDate} to ${endDate}`;
}

export function todayYmd(): string {
  return toDateOnlyYmd(new Date());
}
