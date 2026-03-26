export type EquipmentType = "truck" | "trailer" | "equipment" | "attachment";

export type ExpiryStatus = "ok" | "warning" | "critical" | "expired";

export type EquipmentRecord = {
  id: string;
  org_id: string;
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
  created_at: string;
  updated_at: string;
};

export type EquipmentAssignmentRecord = {
  id: string;
  org_id: string;
  equipment_id: string;
  crew_id: string;
  assigned_date: string;
  notes: string | null;
  crew_name: string | null;
  created_at: string;
  updated_at: string;
};

export type EquipmentScheduleRecord = {
  id: string;
  org_id: string;
  equipment_id: string;
  crew_id: string | null;
  start_date: string;
  end_date: string | null;
  notes: string | null;
  crew_name: string | null;
  created_at: string;
  updated_at: string;
};

export type EquipmentMaintenanceRecord = {
  id: string;
  org_id: string;
  equipment_id: string;
  type: string;
  performed_date: string;
  mileage: number | null;
  next_service_date: string | null;
  next_service_mileage: number | null;
  performed_by: string | null;
  cost: number | null;
  notes: string | null;
  receipt_url: string | null;
  created_at: string;
  updated_at: string;
};

export type VehicleInspectionRecord = {
  id: string;
  org_id: string;
  equipment_id: string;
  driver_id: string;
  inspection_type: "pre_trip" | "post_trip";
  inspection_date: string;
  odometer: number | null;
  passed: boolean;
  defects: string[] | null;
  driver_signature: string | null;
  notes: string | null;
  driver_name: string | null;
  created_at: string;
  updated_at: string;
};

export type EquipmentExpirySummary = {
  registration: ExpiryStatus;
  insurance: ExpiryStatus;
  inspection: ExpiryStatus;
  overall: ExpiryStatus;
  hasAlert: boolean;
};

export type EquipmentWithExpiry = EquipmentRecord & {
  expiry: EquipmentExpirySummary;
};

export type EquipmentDetail = {
  equipment: EquipmentWithExpiry;
  assignments: EquipmentAssignmentRecord[];
  currentAssignment: EquipmentAssignmentRecord | null;
  schedule: EquipmentScheduleRecord[];
  maintenance: EquipmentMaintenanceRecord[];
  inspections: VehicleInspectionRecord[];
};

export type DvirDriverOption = {
  id: string;
  name: string;
};

export const EQUIPMENT_TYPES: EquipmentType[] = [
  "truck",
  "trailer",
  "equipment",
  "attachment",
];
