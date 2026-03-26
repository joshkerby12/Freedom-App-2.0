import { requireOrgContext } from "@/lib/fleet/org-context";
import type { EquipmentMaintenanceRecord } from "@/lib/fleet/types";

const FLEET_DOCS_BUCKET = "fleet-docs";

export type CreateMaintenanceInput = {
  equipmentId: string;
  type: string;
  performedDate: string;
  mileage?: number | null;
  nextServiceDate?: string | null;
  nextServiceMileage?: number | null;
  performedBy?: string | null;
  cost?: number | null;
  notes?: string | null;
  receiptFile?: File | null;
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

function mapMaintenanceRow(row: Record<string, unknown>): EquipmentMaintenanceRecord {
  return {
    id: String(row.id),
    org_id: String(row.org_id),
    equipment_id: String(row.equipment_id),
    type: String(row.type),
    performed_date: String(row.performed_date),
    mileage: typeof row.mileage === "number" ? row.mileage : null,
    next_service_date: typeof row.next_service_date === "string" ? row.next_service_date : null,
    next_service_mileage:
      typeof row.next_service_mileage === "number" ? row.next_service_mileage : null,
    performed_by: typeof row.performed_by === "string" ? row.performed_by : null,
    cost: typeof row.cost === "number" ? row.cost : null,
    notes: typeof row.notes === "string" ? row.notes : null,
    receipt_url: typeof row.receipt_url === "string" ? row.receipt_url : null,
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

async function uploadReceiptIfPresent(
  equipmentId: string,
  orgId: string,
  supabase: Awaited<ReturnType<typeof requireOrgContext>>["supabase"],
  receiptFile: File | null | undefined,
): Promise<string | null> {
  if (!receiptFile || receiptFile.size <= 0) {
    return null;
  }

  const normalizedName = sanitizeFilename(receiptFile.name || "receipt.bin");
  const path = `${orgId}/equipment/${equipmentId}/maintenance/${Date.now()}-${normalizedName}`;

  const { error: uploadError } = await supabase.storage
    .from(FLEET_DOCS_BUCKET)
    .upload(path, receiptFile, {
      upsert: true,
      contentType: receiptFile.type || undefined,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(FLEET_DOCS_BUCKET).getPublicUrl(path);

  return publicUrl;
}

export async function createMaintenanceEntry(
  input: CreateMaintenanceInput,
): Promise<EquipmentMaintenanceRecord> {
  const { supabase, orgId } = await requireOrgContext();

  if (!input.type.trim()) {
    throw new Error("Maintenance type is required.");
  }

  const receiptUrl = await uploadReceiptIfPresent(
    input.equipmentId,
    orgId,
    supabase,
    input.receiptFile,
  );

  const { data, error } = await supabase
    .from("equipment_maintenance")
    .insert({
      org_id: orgId,
      equipment_id: input.equipmentId,
      type: input.type.trim(),
      performed_date: input.performedDate,
      mileage: input.mileage ?? null,
      next_service_date: normalizeNullableString(input.nextServiceDate),
      next_service_mileage: input.nextServiceMileage ?? null,
      performed_by: normalizeNullableString(input.performedBy),
      cost: input.cost ?? null,
      notes: normalizeNullableString(input.notes),
      receipt_url: receiptUrl,
    })
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return mapMaintenanceRow(data as Record<string, unknown>);
}
