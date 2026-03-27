export type EmploymentType =
  | "full_time"
  | "part_time"
  | "temporary"
  | "temp_agency"
  | "contractor"
  | "seasonal";

export type EmployeeStatus = "active" | "on_leave" | "terminated" | "resigned";

export type PayType = "hourly" | "salary";

export type EmployeeFormActionState = {
  error: string | null;
};

export const initialEmployeeFormActionState: EmployeeFormActionState = {
  error: null,
};

export const employmentTypeOptions: Array<{ value: EmploymentType; label: string }> = [
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "temporary", label: "Temporary" },
  { value: "temp_agency", label: "Temp Agency" },
  { value: "contractor", label: "Contractor" },
  { value: "seasonal", label: "Seasonal" },
];

export const employeeStatusOptions: Array<{ value: EmployeeStatus; label: string }> = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "terminated", label: "Terminated" },
  { value: "resigned", label: "Resigned" },
];

export const payTypeOptions: Array<{ value: PayType; label: string }> = [
  { value: "hourly", label: "Hourly" },
  { value: "salary", label: "Salary" },
];
