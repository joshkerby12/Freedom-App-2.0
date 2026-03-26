import type { EquipmentExpirySummary, EquipmentRecord, ExpiryStatus } from "@/lib/fleet/types";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

function toDateOnly(input: Date): Date {
  return new Date(input.getFullYear(), input.getMonth(), input.getDate());
}

function parseDate(value: string): Date {
  return new Date(`${value}T00:00:00`);
}

export function getExpiryStatus(
  dateValue: string | null | undefined,
  today: Date = new Date(),
): ExpiryStatus {
  if (!dateValue) {
    return "ok";
  }

  const todayDate = toDateOnly(today);
  const expiryDate = toDateOnly(parseDate(dateValue));
  const daysUntilExpiry = Math.floor((expiryDate.getTime() - todayDate.getTime()) / DAY_IN_MS);

  if (daysUntilExpiry < 0) {
    return "expired";
  }

  if (daysUntilExpiry <= 30) {
    return "critical";
  }

  if (daysUntilExpiry <= 60) {
    return "warning";
  }

  return "ok";
}

export function mergeExpiryStatuses(statuses: ExpiryStatus[]): ExpiryStatus {
  if (statuses.includes("expired")) {
    return "expired";
  }

  if (statuses.includes("critical")) {
    return "critical";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "ok";
}

export function getEquipmentExpirySummary(
  equipment: Pick<
    EquipmentRecord,
    "registration_expiry" | "insurance_expiry" | "annual_inspection_due"
  >,
  today?: Date,
): EquipmentExpirySummary {
  const registration = getExpiryStatus(equipment.registration_expiry, today);
  const insurance = getExpiryStatus(equipment.insurance_expiry, today);
  const inspection = getExpiryStatus(equipment.annual_inspection_due, today);
  const overall = mergeExpiryStatuses([registration, insurance, inspection]);

  return {
    registration,
    insurance,
    inspection,
    overall,
    hasAlert: overall !== "ok",
  };
}
