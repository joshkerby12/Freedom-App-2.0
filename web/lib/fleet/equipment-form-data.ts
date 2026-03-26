import { EQUIPMENT_TYPES, type EquipmentType } from "@/lib/fleet/types";

export type EquipmentUpsertInput = {
  name: string;
  type: EquipmentType;
  make: string | null;
  model: string | null;
  year: number | null;
  vin_serial: string | null;
  license_plate: string | null;
  dot_number: string | null;
  registration_expiry: string | null;
  insurance_expiry: string | null;
  annual_inspection_due: string | null;
  is_shareable: boolean;
  is_active: boolean;
  notes: string | null;
};

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function toNullableString(value: string): string | null {
  return value.length > 0 ? value : null;
}

function toNullableNumber(value: string): number | null {
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readCheckbox(formData: FormData, key: string): boolean {
  return formData.get(key) === "on";
}

export function readEquipmentUpsertInput(formData: FormData): EquipmentUpsertInput {
  const name = readString(formData, "name");
  const typeCandidate = readString(formData, "type");

  if (!name) {
    throw new Error("Equipment name is required.");
  }

  if (!EQUIPMENT_TYPES.includes(typeCandidate as EquipmentType)) {
    throw new Error("Valid equipment type is required.");
  }

  return {
    name,
    type: typeCandidate as EquipmentType,
    make: toNullableString(readString(formData, "make")),
    model: toNullableString(readString(formData, "model")),
    year: toNullableNumber(readString(formData, "year")),
    vin_serial: toNullableString(readString(formData, "vin_serial")),
    license_plate: toNullableString(readString(formData, "license_plate")),
    dot_number: toNullableString(readString(formData, "dot_number")),
    registration_expiry: toNullableString(readString(formData, "registration_expiry")),
    insurance_expiry: toNullableString(readString(formData, "insurance_expiry")),
    annual_inspection_due: toNullableString(readString(formData, "annual_inspection_due")),
    is_shareable: readCheckbox(formData, "is_shareable"),
    is_active: readCheckbox(formData, "is_active"),
    notes: toNullableString(readString(formData, "notes")),
  };
}
