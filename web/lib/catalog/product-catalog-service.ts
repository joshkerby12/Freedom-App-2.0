import { requireCatalogOrgContext } from "@/lib/catalog/org-context";
import type {
  CatalogLookupOption,
  MaterialConfigType,
  ProductCatalogDetail,
  ProductCatalogInput,
  ProductCatalogInputRecord,
  ProductCatalogRecord,
} from "@/lib/catalog/types";

export type ProductCatalogListFilters = {
  search?: string;
  includeInactive?: boolean;
};

function asString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asBoolean(value: unknown): boolean {
  return value === true;
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

function normalizeOptionalText(value: string | null | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const entries = value
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter((entry) => entry.length > 0);

  return entries.length > 0 ? entries : null;
}

function escapeForIlike(value: string): string {
  return value
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replaceAll(",", " ")
    .trim();
}

function isMaterialConfigType(value: string | null): value is MaterialConfigType {
  return (
    value === "paver_patio" ||
    value === "wall" ||
    value === "flagstone" ||
    value === "mulch_bed" ||
    value === "sod" ||
    value === "rock_bed" ||
    value === "turf"
  );
}

function extractConfigTypeFilter(customOptions: string[] | null): MaterialConfigType | null {
  if (!customOptions) {
    return null;
  }

  const marker = customOptions.find((entry) => entry.startsWith("config_type:"));
  if (!marker) {
    return null;
  }

  const type = marker.replace("config_type:", "").trim();
  return isMaterialConfigType(type) ? type : null;
}

function stripConfigMarker(customOptions: string[] | null): string[] | null {
  if (!customOptions) {
    return null;
  }

  const cleaned = customOptions.filter((entry) => !entry.startsWith("config_type:"));
  return cleaned.length > 0 ? cleaned : null;
}

function mapProductRow(row: Record<string, unknown>): ProductCatalogRecord {
  return {
    id: String(row.id),
    name: String(row.name),
    category: row.category as ProductCatalogRecord["category"],
    pricing_mode: row.pricing_mode as ProductCatalogRecord["pricing_mode"],
    install_rate: asNumber(row.install_rate),
    minimum_hours: asNumber(row.minimum_hours),
    flat_rate_price: asNumber(row.flat_rate_price),
    labor_rate_override: asNumber(row.labor_rate_override),
    equipment_rate_override: asNumber(row.equipment_rate_override),
    default_description: asString(row.default_description),
    quickbooks_item_code: asString(row.quickbooks_item_code),
    is_system_template: asBoolean(row.is_system_template),
    is_active: asBoolean(row.is_active),
    sort_order: asInteger(row.sort_order),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
  };
}

function mapInputRow(row: Record<string, unknown>): ProductCatalogInputRecord {
  const rawOptions = parseStringArray(row.custom_options);

  return {
    id: String(row.id),
    label: String(row.label),
    input_type: row.input_type as ProductCatalogInputRecord["input_type"],
    unit_label: asString(row.unit_label),
    is_required: asBoolean(row.is_required),
    default_value: asString(row.default_value),
    custom_options: stripConfigMarker(rawOptions),
    config_type_filter: extractConfigTypeFilter(rawOptions),
    sort_order: asInteger(row.sort_order),
  };
}

function mapComponentRow(
  row: Record<string, unknown>,
): ProductCatalogDetail["components"][number] {
  const itemJoin = Array.isArray(row.catalog_items)
    ? (row.catalog_items[0] as Record<string, unknown> | undefined)
    : (row.catalog_items as Record<string, unknown> | null);

  return {
    id: String(row.id),
    label: String(row.label),
    component_type: row.component_type as ProductCatalogDetail["components"][number]["component_type"],
    catalog_item_id: asString(row.catalog_item_id),
    catalog_item_name: asString(itemJoin?.name),
    input_ref: asString(row.input_ref),
    configuration_input_ref: asString(row.configuration_input_ref),
    qty_formula: String(row.qty_formula),
    sort_order: asInteger(row.sort_order),
  };
}

async function replaceProductInputs(
  orgId: string,
  productId: string,
  input: ProductCatalogInput,
): Promise<void> {
  const { supabase } = await requireCatalogOrgContext();

  const { error: deleteError } = await supabase
    .from("product_catalog_inputs")
    .delete()
    .eq("org_id", orgId)
    .eq("product_catalog_id", productId);

  if (deleteError) {
    throw new Error("Unable to update product inputs: " + deleteError.message);
  }

  const payload = input.inputs
    .map((entry, index) => {
      const label = normalizeOptionalText(entry.label);
      if (label === null) {
        return null;
      }

      const customOptions = entry.customOptions
        ?.map((option) => option.trim())
        .filter((option) => option.length > 0) ?? null;
      const configTypeMarker = entry.configTypeFilter
        ? ["config_type:" + entry.configTypeFilter]
        : [];

      const finalCustomOptions = [...(customOptions ?? []), ...configTypeMarker];

      return {
        org_id: orgId,
        product_catalog_id: productId,
        label,
        input_type: entry.inputType,
        unit_label: normalizeOptionalText(entry.unitLabel ?? null),
        is_required: entry.isRequired !== false,
        default_value: normalizeOptionalText(entry.defaultValue ?? null),
        custom_options: finalCustomOptions.length > 0 ? finalCustomOptions : null,
        sort_order: entry.sortOrder ?? index,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (payload.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("product_catalog_inputs")
    .insert(payload);

  if (insertError) {
    throw new Error("Unable to save product inputs: " + insertError.message);
  }
}

async function replaceProductComponents(
  orgId: string,
  productId: string,
  input: ProductCatalogInput,
): Promise<void> {
  const { supabase } = await requireCatalogOrgContext();

  const { error: deleteError } = await supabase
    .from("product_catalog_components")
    .delete()
    .eq("org_id", orgId)
    .eq("product_catalog_id", productId);

  if (deleteError) {
    throw new Error("Unable to update product components: " + deleteError.message);
  }

  const payload = input.components
    .map((entry, index) => {
      const label = normalizeOptionalText(entry.label);
      const qtyFormula = normalizeOptionalText(entry.qtyFormula);
      if (label === null) {
        return null;
      }

      if (qtyFormula === null) {
        throw new Error("Each component requires a quantity formula.");
      }

      return {
        org_id: orgId,
        product_catalog_id: productId,
        label,
        component_type: entry.componentType,
        catalog_item_id: normalizeOptionalText(entry.catalogItemId ?? null),
        input_ref: normalizeOptionalText(entry.inputRef ?? null),
        configuration_input_ref: normalizeOptionalText(entry.configurationInputRef ?? null),
        qty_formula: qtyFormula,
        sort_order: entry.sortOrder ?? index,
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null);

  if (payload.length === 0) {
    return;
  }

  const { error: insertError } = await supabase
    .from("product_catalog_components")
    .insert(payload);

  if (insertError) {
    throw new Error("Unable to save product components: " + insertError.message);
  }
}

export async function getProducts(
  filters: ProductCatalogListFilters = {},
): Promise<ProductCatalogRecord[]> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  let query = supabase
    .from("product_catalog")
    .select("*")
    .eq("org_id", orgId)
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (filters.includeInactive !== true) {
    query = query.eq("is_active", true);
  }

  if (filters.search && filters.search.trim()) {
    const term = escapeForIlike(filters.search);
    query = query.or("name.ilike.%" + term + "%,default_description.ilike.%" + term + "%");
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load products: " + error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapProductRow);
}

export async function getProduct(productId: string): Promise<ProductCatalogDetail | null> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { data: product, error: productError } = await supabase
    .from("product_catalog")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", productId)
    .maybeSingle();

  if (productError) {
    throw new Error("Unable to load product: " + productError.message);
  }

  if (!product) {
    return null;
  }

  const { data: inputData, error: inputError } = await supabase
    .from("product_catalog_inputs")
    .select("*")
    .eq("org_id", orgId)
    .eq("product_catalog_id", productId)
    .order("sort_order", { ascending: true });

  if (inputError) {
    throw new Error("Unable to load product inputs: " + inputError.message);
  }

  const { data: componentData, error: componentError } = await supabase
    .from("product_catalog_components")
    .select("*,catalog_items(name)")
    .eq("org_id", orgId)
    .eq("product_catalog_id", productId)
    .order("sort_order", { ascending: true });

  if (componentError) {
    throw new Error("Unable to load product components: " + componentError.message);
  }

  const mappedProduct = mapProductRow(product as Record<string, unknown>);
  return {
    ...mappedProduct,
    inputs: ((inputData ?? []) as Array<Record<string, unknown>>).map(mapInputRow),
    components: ((componentData ?? []) as Array<Record<string, unknown>>).map(
      mapComponentRow,
    ),
  };
}

export async function createProduct(input: ProductCatalogInput): Promise<string> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const name = normalizeOptionalText(input.name);
  if (name === null) {
    throw new Error("Product name is required.");
  }

  const { data, error } = await supabase
    .from("product_catalog")
    .insert({
      org_id: orgId,
      name,
      category: input.category,
      pricing_mode: input.pricingMode,
      install_rate: input.installRate ?? null,
      minimum_hours: input.minimumHours ?? null,
      flat_rate_price: input.flatRatePrice ?? null,
      labor_rate_override: input.laborRateOverride ?? null,
      equipment_rate_override: input.equipmentRateOverride ?? null,
      default_description: normalizeOptionalText(input.defaultDescription ?? null),
      quickbooks_item_code: normalizeOptionalText(input.quickbooksItemCode ?? null),
      is_active: input.isActive !== false,
      sort_order: input.sortOrder ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("Unable to create product: " + error.message);
  }

  const productId = String(data.id);
  await replaceProductInputs(orgId, productId, input);
  await replaceProductComponents(orgId, productId, input);
  return productId;
}

export async function updateProduct(
  productId: string,
  input: ProductCatalogInput,
): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const name = normalizeOptionalText(input.name);
  if (name === null) {
    throw new Error("Product name is required.");
  }

  const { error } = await supabase
    .from("product_catalog")
    .update({
      name,
      category: input.category,
      pricing_mode: input.pricingMode,
      install_rate: input.installRate ?? null,
      minimum_hours: input.minimumHours ?? null,
      flat_rate_price: input.flatRatePrice ?? null,
      labor_rate_override: input.laborRateOverride ?? null,
      equipment_rate_override: input.equipmentRateOverride ?? null,
      default_description: normalizeOptionalText(input.defaultDescription ?? null),
      quickbooks_item_code: normalizeOptionalText(input.quickbooksItemCode ?? null),
      is_active: input.isActive !== false,
      sort_order: input.sortOrder ?? 0,
    })
    .eq("org_id", orgId)
    .eq("id", productId);

  if (error) {
    throw new Error("Unable to update product: " + error.message);
  }

  await replaceProductInputs(orgId, productId, input);
  await replaceProductComponents(orgId, productId, input);
}

export async function deleteProduct(productId: string): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { data: product, error: lookupError } = await supabase
    .from("product_catalog")
    .select("is_system_template")
    .eq("org_id", orgId)
    .eq("id", productId)
    .maybeSingle();

  if (lookupError) {
    throw new Error("Unable to check product template type: " + lookupError.message);
  }

  if (!product) {
    throw new Error("Product not found.");
  }

  if (asBoolean(product.is_system_template)) {
    throw new Error("System templates cannot be deleted.");
  }

  const { error } = await supabase
    .from("product_catalog")
    .delete()
    .eq("org_id", orgId)
    .eq("id", productId);

  if (error) {
    throw new Error("Unable to delete product: " + error.message);
  }
}

export async function getProductCatalogLookupOptions(): Promise<{
  items: CatalogLookupOption[];
  configurations: CatalogLookupOption[];
}> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const [itemResult, configResult] = await Promise.all([
    supabase
      .from("catalog_items")
      .select("id,name,unit,color")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("name", { ascending: true }),
    supabase
      .from("material_configurations")
      .select("id,name,config_type,color")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("config_type", { ascending: true })
      .order("name", { ascending: true }),
  ]);

  if (itemResult.error) {
    throw new Error("Unable to load catalog item options: " + itemResult.error.message);
  }

  if (configResult.error) {
    throw new Error("Unable to load configuration options: " + configResult.error.message);
  }

  const items = ((itemResult.data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    label: String(row.name),
    subtitle: asString(row.unit),
    color: asString(row.color),
  }));

  const configurations = ((configResult.data ?? []) as Array<Record<string, unknown>>).map(
    (row) => ({
      id: String(row.id),
      label: String(row.name),
      subtitle: asString(row.config_type),
      color: asString(row.color),
    }),
  );

  return {
    items,
    configurations,
  };
}
