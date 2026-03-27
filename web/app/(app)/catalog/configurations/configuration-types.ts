import type { MaterialConfigRecord, MaterialConfigRoleInput } from "@/lib/catalog/types";

export type ConfigurationFormActionState = {
  error: string | null;
};

export const initialConfigurationFormActionState: ConfigurationFormActionState = {
  error: null,
};

export type EditableConfigurationRole = {
  roleKey: string;
  catalogItemId: string;
  areaPct: string;
  orientation: "soldier" | "sailor" | "";
};

export function getInitialConfigurationRoles(
  requiredRoleKeys: string[],
  config?: MaterialConfigRecord,
): EditableConfigurationRole[] {
  const roleMap = new Map<string, MaterialConfigRoleInput>();

  for (const role of config?.roles ?? []) {
    roleMap.set(role.role_key, {
      roleKey: role.role_key,
      catalogItemId: role.catalog_item_id,
      areaPct: role.area_pct,
      orientation: role.orientation,
      sortOrder: role.sort_order,
    });
  }

  const roleKeys = requiredRoleKeys.length > 0
    ? requiredRoleKeys
    : config?.roles.map((role) => role.role_key) ?? [];

  return roleKeys.map((roleKey) => {
    const existingRole = roleMap.get(roleKey);

    return {
      roleKey,
      catalogItemId: existingRole?.catalogItemId ?? "",
      areaPct:
        existingRole?.areaPct === null || existingRole?.areaPct === undefined
          ? ""
          : String(existingRole.areaPct),
      orientation: existingRole?.orientation ?? "",
    };
  });
}
