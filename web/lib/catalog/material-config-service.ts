import { requireCatalogOrgContext } from "@/lib/catalog/org-context";
import type {
  CatalogLookupOption,
  MaterialConfigInput,
  MaterialConfigRecord,
  MaterialConfigRoleRecord,
  MaterialConfigType,
} from "@/lib/catalog/types";

export const MATERIAL_CONFIG_ROLE_REQUIREMENTS: Record<MaterialConfigType, string[]> = {
  paver_patio: ["field", "border_soldier", "border_sailor"],
  wall: ["block", "cap"],
  flagstone: ["field", "border"],
  mulch_bed: ["mulch", "edging"],
  sod: ["sod", "soil_amendment"],
  rock_bed: ["rock", "edging"],
  turf: ["turf", "infill", "edging"],
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function asInteger(value: unknown): number {
  const numeric = asNumber(value);
  return numeric === null ? 0 : Math.round(numeric);
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeRoleKey(value: string): string {
  return value.trim().toLowerCase();
}

function mapRoleRow(row: Record<string, unknown>): MaterialConfigRoleRecord {
  const itemJoin = Array.isArray(row.catalog_items)
    ? (row.catalog_items[0] as Record<string, unknown> | undefined)
    : (row.catalog_items as Record<string, unknown> | null);

  return {
    id: String(row.id),
    role_key: String(row.role_key),
    catalog_item_id: String(row.catalog_item_id),
    catalog_item_name: asString(itemJoin?.name) ?? "Unknown item",
    catalog_item_color: asString(itemJoin?.color),
    area_pct: asNumber(row.area_pct),
    orientation:
      row.orientation === "soldier" || row.orientation === "sailor"
        ? row.orientation
        : null,
    sort_order: asInteger(row.sort_order),
  };
}

function mapConfigRow(
  row: Record<string, unknown>,
  roles: MaterialConfigRoleRecord[],
): MaterialConfigRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    config_type: row.config_type as MaterialConfigType,
    color: asString(row.color),
    is_active: asBoolean(row.is_active),
    sort_order: asInteger(row.sort_order),
    roles,
  };
}

function ensureRequiredRoles(input: MaterialConfigInput): void {
  const requiredRoles = MATERIAL_CONFIG_ROLE_REQUIREMENTS[input.configType];
  if (!requiredRoles) {
    throw new Error("Unsupported configuration type.");
  }

  const assignedRoles = new Set(
    input.roles
      .map((role) => normalizeRoleKey(role.roleKey))
      .filter((roleKey) => roleKey.length > 0 && roleKey !== ""),
  );

  const missingRoles = requiredRoles.filter((roleKey) => !assignedRoles.has(roleKey));
  if (missingRoles.length > 0) {
    throw new Error(
      "Missing required role assignments: " + missingRoles.join(", "),
    );
  }

  const missingCatalogItems = input.roles
    .filter((role) => requiredRoles.includes(normalizeRoleKey(role.roleKey)))
    .filter(
      (role) =>
        normalizeOptionalText(role.catalogItemId) === null,
    )
    .map((role) => normalizeRoleKey(role.roleKey));

  if (missingCatalogItems.length > 0) {
    throw new Error(
      "Required roles need catalog items: " + missingCatalogItems.join(", "),
    );
  }
}

async function deriveConfigColor(
  orgId: string,
  catalogItemIds: string[],
): Promise<string | null> {
  if (catalogItemIds.length === 0) {
    return null;
  }

  const { supabase } = await requireCatalogOrgContext();
  const { data, error } = await supabase
    .from("catalog_items")
    .select("id,color")
    .eq("org_id", orgId)
    .in("id", catalogItemIds);

  if (error) {
    throw new Error("Unable to resolve item colors: " + error.message);
  }

  const colors = ((data ?? []) as Array<Record<string, unknown>>)
    .map((row) => asString(row.color))
    .filter((color): color is string => color !== null);

  const uniqueColors = [...new Set(colors)];
  if (uniqueColors.length === 0) {
    return null;
  }

  return uniqueColors.join(" / ");
}

async function replaceRoles(
  orgId: string,
  configId: string,
  input: MaterialConfigInput,
): Promise<void> {
  const { supabase } = await requireCatalogOrgContext();

  const { error: deleteError } = await supabase
    .from("material_configuration_roles")
    .delete()
    .eq("org_id", orgId)
    .eq("configuration_id", configId);

  if (deleteError) {
    throw new Error("Unable to update configuration roles: " + deleteError.message);
  }

  if (input.roles.length === 0) {
    return;
  }

  const payload = input.roles
    .map((role, index) => ({
      org_id: orgId,
      configuration_id: configId,
      role_key: normalizeRoleKey(role.roleKey),
      catalog_item_id: role.catalogItemId,
      area_pct: role.areaPct ?? null,
      orientation: role.orientation ?? null,
      sort_order: role.sortOrder ?? index,
    }))
    .filter((role) => normalizeOptionalText(role.catalog_item_id) !== null);

  if (payload.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("material_configuration_roles")
    .insert(payload);

  if (insertError) {
    throw new Error("Unable to save configuration roles: " + insertError.message);
  }
}

export async function getConfigs(search?: string): Promise<MaterialConfigRecord[]> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  let query = supabase
    .from("material_configurations")
    .select("*")
    .eq("org_id", orgId)
    .order("config_type", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (search && search.trim()) {
    const term = search.trim().replaceAll("%", "\\%").replaceAll("_", "\\_");
    query = query.ilike("name", "%" + term + "%");
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load configurations: " + error.message);
  }

  const configs = (data ?? []) as Array<Record<string, unknown>>;
  if (configs.length === 0) {
    return [];
  }

  const configIds = configs.map((config) => String(config.id));
  const { data: roleData, error: roleError } = await supabase
    .from("material_configuration_roles")
    .select("*,catalog_items(name,color)")
    .eq("org_id", orgId)
    .in("configuration_id", configIds)
    .order("sort_order", { ascending: true });

  if (roleError) {
    throw new Error("Unable to load configuration roles: " + roleError.message);
  }

  const rolesByConfigId = new Map<string, MaterialConfigRoleRecord[]>();
  for (const row of (roleData ?? []) as Array<Record<string, unknown>>) {
    const role = mapRoleRow(row);
    const configId = String(row.configuration_id);
    const current = rolesByConfigId.get(configId) ?? [];
    current.push(role);
    rolesByConfigId.set(configId, current);
  }

  return configs.map((config) =>
    mapConfigRow(config, rolesByConfigId.get(String(config.id)) ?? []),
  );
}

export async function getConfig(configId: string): Promise<MaterialConfigRecord | null> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { data: config, error: configError } = await supabase
    .from("material_configurations")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", configId)
    .maybeSingle();

  if (configError) {
    throw new Error("Unable to load configuration: " + configError.message);
  }

  if (!config) {
    return null;
  }

  const { data: roleData, error: roleError } = await supabase
    .from("material_configuration_roles")
    .select("*,catalog_items(name,color)")
    .eq("org_id", orgId)
    .eq("configuration_id", configId)
    .order("sort_order", { ascending: true });

  if (roleError) {
    throw new Error("Unable to load configuration roles: " + roleError.message);
  }

  const roles = ((roleData ?? []) as Array<Record<string, unknown>>).map(mapRoleRow);
  return mapConfigRow(config as Record<string, unknown>, roles);
}

export async function createConfig(input: MaterialConfigInput): Promise<string> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const name = normalizeOptionalText(input.name);
  if (name === null) {
    throw new Error("Configuration name is required.");
  }

  ensureRequiredRoles(input);
  const color = await deriveConfigColor(
    orgId,
    input.roles.map((role) => role.catalogItemId).filter((id) => asString(id) !== null) as string[],
  );

  const { data, error } = await supabase
    .from("material_configurations")
    .insert({
      org_id: orgId,
      name,
      config_type: input.configType,
      color,
      is_active: input.isActive !== false,
      sort_order: input.sortOrder ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("Unable to create configuration: " + error.message);
  }

  const configId = String(data.id);
  await replaceRoles(orgId, configId, input);
  return configId;
}

export async function updateConfig(
  configId: string,
  input: MaterialConfigInput,
): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const name = normalizeOptionalText(input.name);
  if (name === null) {
    throw new Error("Configuration name is required.");
  }

  ensureRequiredRoles(input);
  const color = await deriveConfigColor(
    orgId,
    input.roles.map((role) => role.catalogItemId).filter((id) => asString(id) !== null) as string[],
  );

  const { error } = await supabase
    .from("material_configurations")
    .update({
      name,
      config_type: input.configType,
      color,
      is_active: input.isActive !== false,
      sort_order: input.sortOrder ?? 0,
    })
    .eq("org_id", orgId)
    .eq("id", configId);

  if (error) {
    throw new Error("Unable to update configuration: " + error.message);
  }

  await replaceRoles(orgId, configId, input);
}

export async function deleteConfig(configId: string): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { error } = await supabase
    .from("material_configurations")
    .delete()
    .eq("org_id", orgId)
    .eq("id", configId);

  if (error) {
    throw new Error("Unable to delete configuration: " + error.message);
  }
}

export async function getMaterialConfigItemOptions(): Promise<CatalogLookupOption[]> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { data, error } = await supabase
    .from("catalog_items")
    .select("id,name,unit,color")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load catalog item options: " + error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    label: String(row.name),
    subtitle: asString(row.unit),
    color: asString(row.color),
  }));
}
