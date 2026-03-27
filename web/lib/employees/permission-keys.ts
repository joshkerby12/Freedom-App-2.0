export const PERMISSION_KEYS = [
  "clients.view",
  "clients.create",
  "clients.edit",
  "clients.delete",
  "estimates.view",
  "estimates.create",
  "estimates.edit",
  "estimates.delete",
  "jobs.view",
  "jobs.create",
  "jobs.edit",
  "jobs.delete",
  "catalog.view",
  "catalog.manage",
  "employees.view",
  "employees.manage",
  "compensation.view",
  "settings.manage",
  "financials.view",
  "scheduling.view",
  "scheduling.manage",
  "fleet.view",
  "fleet.manage",
  "equipment.view",
  "equipment.schedule",
  "equipment.approve",
  "reports.view",
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export const PERMISSION_GROUPS: Array<{
  label: string;
  keys: PermissionKey[];
}> = [
  {
    label: "Clients",
    keys: ["clients.view", "clients.create", "clients.edit", "clients.delete"],
  },
  {
    label: "Estimates",
    keys: ["estimates.view", "estimates.create", "estimates.edit", "estimates.delete"],
  },
  {
    label: "Jobs",
    keys: ["jobs.view", "jobs.create", "jobs.edit", "jobs.delete"],
  },
  {
    label: "Catalog",
    keys: ["catalog.view", "catalog.manage"],
  },
  {
    label: "Employees",
    keys: ["employees.view", "employees.manage", "compensation.view", "settings.manage"],
  },
  {
    label: "Operations",
    keys: [
      "financials.view",
      "scheduling.view",
      "scheduling.manage",
      "fleet.view",
      "fleet.manage",
      "equipment.view",
      "equipment.schedule",
      "equipment.approve",
      "reports.view",
    ],
  },
];
