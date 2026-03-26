import { requireOrgContext } from "@/lib/fleet/org-context";
import type { DvirDriverOption, VehicleInspectionRecord } from "@/lib/fleet/types";

const FLEET_DOCS_BUCKET = "fleet-docs";

export const COMMON_DVIR_DEFECTS = [
  "Brakes",
  "Lights/Signals",
  "Tires",
  "Horn",
  "Wipers",
  "Mirrors",
  "Fuel/Fluids",
  "Frame/Body",
  "Coupling Devices",
  "Other",
] as const;

export type CreateDvirInput = {
  equipmentId: string;
  driverId: string;
  inspectionType: "pre_trip" | "post_trip";
  inspectionDate: string;
  passed: boolean;
  odometer?: number | null;
  defects?: string[];
  notes?: string | null;
  signatureFile?: File | null;
};

function normalizeNullableString(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeFilename(filename: string): string {
  return filename.replaceAll(/[^a-zA-Z0-9._-]/g, "_");
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
    odometer: typeof row.odometer === "number" ? row.odometer : null,
    passed: Boolean(row.passed),
    defects,
    driver_signature: typeof row.driver_signature === "string" ? row.driver_signature : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    driver_name: null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function resolveEmployeeName(row: Record<string, unknown>): string {
  const displayName =
    typeof row.display_name === "string" ? row.display_name.trim() : "";
  if (displayName) {
    return displayName;
  }

  const first = typeof row.first_name === "string" ? row.first_name.trim() : "";
  const last = typeof row.last_name === "string" ? row.last_name.trim() : "";
  const full = `${first} ${last}`.trim();

  return full || "Unknown Driver";
}

async function uploadSignatureIfPresent(
  equipmentId: string,
  orgId: string,
  supabase: Awaited<ReturnType<typeof requireOrgContext>>["supabase"],
  signatureFile: File | null | undefined,
): Promise<string | null> {
  if (!signatureFile || signatureFile.size <= 0) {
    return null;
  }

  const normalizedName = sanitizeFilename(signatureFile.name || "signature.bin");
  const path = `${orgId}/equipment/${equipmentId}/dvir/${Date.now()}-${normalizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(FLEET_DOCS_BUCKET)
    .upload(path, signatureFile, {
      upsert: true,
      contentType: signatureFile.type || undefined,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(FLEET_DOCS_BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function listDvirDrivers(): Promise<DvirDriverOption[]> {
  const { supabase, orgId } = await requireOrgContext();

  const { data, error } = await supabase
    .from("employees")
    .select("id,first_name,last_name,display_name,employee_status")
    .eq("org_id", orgId)
    .eq("employee_status", "active")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: resolveEmployeeName(row),
  }));
}

export async function createDvirEntry(
  input: CreateDvirInput,
): Promise<VehicleInspectionRecord> {
  const { supabase, orgId } = await requireOrgContext();

  if (!input.driverId.trim()) {
    throw new Error("Driver is required for DVIR.");
  }

  const signatureUrl = await uploadSignatureIfPresent(
    input.equipmentId,
    orgId,
    supabase,
    input.signatureFile,
  );

  const defects = input.passed
    ? null
    : (input.defects ?? []).filter((item) => COMMON_DVIR_DEFECTS.includes(item as (typeof COMMON_DVIR_DEFECTS)[number]));

  const { data, error } = await supabase
    .from("vehicle_inspections")
    .insert({
      org_id: orgId,
      equipment_id: input.equipmentId,
      driver_id: input.driverId,
      inspection_type: input.inspectionType,
      inspection_date: input.inspectionDate,
      odometer: input.odometer ?? null,
      passed: input.passed,
      defects,
      driver_signature: signatureUrl,
      notes: normalizeNullableString(input.notes),
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapInspectionRow(data as Record<string, unknown>);
}
