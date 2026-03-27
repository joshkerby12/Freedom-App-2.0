import { requireCatalogOrgContext } from "@/lib/catalog/org-context";
import type {
  CatalogItemDetail,
  CatalogItemInput,
  CatalogItemListItem,
  CatalogItemSpec,
  CatalogItemSupplierInput,
  CatalogItemSupplierLink,
} from "@/lib/catalog/types";

export type CatalogItemListFilters = {
  search?: string;
  unit?: string;
  needsReview?: boolean;
  includeInactive?: boolean;
};

export type ItemSupplierOption = {
  id: string;
  name: string;
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

function asInteger(value: unknown): number | null {
  const numeric = asNumber(value);
  if (numeric === null) {
    return null;
  }

  return Number.isInteger(numeric) ? numeric : Math.round(numeric);
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

function escapeForIlike(value: string): string {
  return value
    .replaceAll("%", "\\%")
    .replaceAll("_", "\\_")
    .replaceAll(",", " ")
    .trim();
}

function todayYmd(): string {
  return new Date().toISOString().split("T")[0];
}

function addDaysYmd(ymd: string, days: number): string {
  const date = new Date(ymd + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().split("T")[0];
}

function daysBetween(fromYmd: string, toYmd: string): number {
  const from = new Date(fromYmd + "T00:00:00.000Z");
  const to = new Date(toYmd + "T00:00:00.000Z");
  const milliseconds = to.getTime() - from.getTime();
  return Math.floor(milliseconds / (1000 * 60 * 60 * 24));
}

function parseExtraSpecs(
  value: unknown,
): Record<string, string | number> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const entries = Object.entries(value as Record<string, unknown>)
    .map(([key, rawValue]) => [key.trim(), rawValue] as const)
    .filter(([key]) => key.length > 0)
    .map(([key, rawValue]) => {
      if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
        return [key, rawValue] as const;
      }

      if (typeof rawValue === "string") {
        const trimmed = rawValue.trim();
        if (!trimmed) {
          return null;
        }

        const numeric = Number(trimmed);
        if (Number.isFinite(numeric)) {
          return [key, numeric] as const;
        }

        return [key, trimmed] as const;
      }

      return null;
    })
    .filter((entry) => entry !== null) as Array<readonly [string, string | number]>;

  return entries.length > 0 ? Object.fromEntries(entries) : null;
}

function deriveReviewDetails(
  row: Record<string, unknown>,
): Pick<CatalogItemListItem, "review_due_date" | "is_overdue" | "days_overdue"> {
  const frequencyDays = asInteger(row.price_review_frequency_days);
  if (frequencyDays === null || frequencyDays <= 0) {
    return {
      review_due_date: null,
      is_overdue: false,
      days_overdue: 0,
    };
  }

  const lastUpdated = asString(row.last_price_updated_at);
  const createdAt = asString(row.created_at);
  const reviewBase = lastUpdated ?? (createdAt ? createdAt.split("T")[0] : todayYmd());
  const dueDate = addDaysYmd(reviewBase, frequencyDays);
  const today = todayYmd();
  const overdueDays = daysBetween(dueDate, today);
  const isOverdue = overdueDays > 0;

  return {
    review_due_date: dueDate,
    is_overdue: isOverdue,
    days_overdue: isOverdue ? overdueDays : 0,
  };
}

function mapItemRow(row: Record<string, unknown>): CatalogItemListItem {
  const review = deriveReviewDetails(row);

  return {
    id: String(row.id),
    name: String(row.name),
    unit: String(row.unit),
    description: asString(row.description),
    default_cost: asNumber(row.default_cost),
    default_sell_price: asNumber(row.default_sell_price),
    default_markup_pct: asNumber(row.default_markup_pct),
    waste_pct: asNumber(row.waste_pct) ?? 0,
    color: asString(row.color),
    quantity_type:
      row.quantity_type === "whole" || row.quantity_type === "decimal"
        ? row.quantity_type
        : "decimal",
    round_to: asNumber(row.round_to),
    minimum_qty: asNumber(row.minimum_qty),
    package_unit: asString(row.package_unit),
    price_review_frequency_days: asInteger(row.price_review_frequency_days),
    price_auto_increase_pct: asNumber(row.price_auto_increase_pct),
    price_auto_increase_months: asInteger(row.price_auto_increase_months),
    price_next_increase_date: asString(row.price_next_increase_date),
    last_price_updated_at: asString(row.last_price_updated_at),
    is_active: asBoolean(row.is_active),
    created_at: String(row.created_at),
    updated_at: String(row.updated_at),
    review_due_date: review.review_due_date,
    is_overdue: review.is_overdue,
    days_overdue: review.days_overdue,
  };
}

function mapSpecRow(
  row: Record<string, unknown> | null,
): CatalogItemSpec | null {
  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    catalog_item_id: String(row.catalog_item_id),
    length_in: asNumber(row.length_in),
    width_in: asNumber(row.width_in),
    height_depth_in: asNumber(row.height_depth_in),
    spread_rate_sqft_per_inch: asNumber(row.spread_rate_sqft_per_inch),
    face_feet: asNumber(row.face_feet),
    extra_specs: parseExtraSpecs(row.extra_specs),
  };
}

function readJoinName(value: unknown): string | null {
  if (Array.isArray(value)) {
    const first = value[0] as { name?: unknown } | undefined;
    return asString(first?.name);
  }

  if (value && typeof value === "object" && "name" in value) {
    return asString((value as { name?: unknown }).name);
  }

  return null;
}

function mapSupplierLinkRow(row: Record<string, unknown>): CatalogItemSupplierLink {
  return {
    id: String(row.id),
    supplier_id: String(row.supplier_id),
    supplier_name: readJoinName(row.suppliers) ?? "Unknown supplier",
    supplier_location_id: asString(row.supplier_location_id),
    supplier_location_name: readJoinName(row.supplier_locations),
    supplier_sku: asString(row.supplier_sku),
    supplier_item_name: asString(row.supplier_item_name),
    unit_cost: asNumber(row.unit_cost),
    last_price_date: asString(row.last_price_date),
    is_preferred: asBoolean(row.is_preferred),
  };
}

function sanitizeSupplierInputs(
  suppliers: CatalogItemSupplierInput[] | undefined,
): CatalogItemSupplierInput[] {
  if (!suppliers || suppliers.length === 0) {
    return [];
  }

  const filtered = suppliers
    .map((supplier) => ({
      supplierId: normalizeOptionalText(supplier.supplierId),
      supplierLocationId: normalizeOptionalText(supplier.supplierLocationId ?? null),
      supplierSku: normalizeOptionalText(supplier.supplierSku ?? null),
      supplierItemName: normalizeOptionalText(supplier.supplierItemName ?? null),
      unitCost: supplier.unitCost ?? null,
      lastPriceDate: normalizeOptionalText(supplier.lastPriceDate ?? null),
      isPreferred: supplier.isPreferred === true,
    }))
    .filter((supplier) => {
      return typeof supplier.supplierId === "string" && supplier.supplierId.length > 0;
    });

  let preferredChosen = false;
  return filtered.map((supplier) => {
    const shouldBePreferred = supplier.isPreferred === true && preferredChosen === false;
    if (shouldBePreferred) {
      preferredChosen = true;
    }

    return {
      supplierId: supplier.supplierId as string,
      supplierLocationId: supplier.supplierLocationId,
      supplierSku: supplier.supplierSku,
      supplierItemName: supplier.supplierItemName,
      unitCost: supplier.unitCost,
      lastPriceDate: supplier.lastPriceDate,
      isPreferred: shouldBePreferred,
    };
  });
}

async function replaceSupplierLinks(
  orgId: string,
  itemId: string,
  suppliers: CatalogItemSupplierInput[] | undefined,
): Promise<void> {
  const { supabase } = await requireCatalogOrgContext();
  const normalizedSuppliers = sanitizeSupplierInputs(suppliers);

  const { error: deleteError } = await supabase
    .from("catalog_item_suppliers")
    .delete()
    .eq("org_id", orgId)
    .eq("catalog_item_id", itemId);

  if (deleteError) {
    throw new Error("Unable to update supplier links: " + deleteError.message);
  }

  if (normalizedSuppliers.length === 0) {
    return;
  }

  const payload = normalizedSuppliers.map((supplier) => ({
    org_id: orgId,
    catalog_item_id: itemId,
    supplier_id: supplier.supplierId,
    supplier_location_id: supplier.supplierLocationId ?? null,
    supplier_sku: supplier.supplierSku ?? null,
    supplier_item_name: supplier.supplierItemName ?? null,
    unit_cost: supplier.unitCost ?? null,
    last_price_date: supplier.lastPriceDate ?? null,
    is_preferred: supplier.isPreferred === true,
  }));

  const { error: insertError } = await supabase
    .from("catalog_item_suppliers")
    .insert(payload);

  if (insertError) {
    throw new Error("Unable to save supplier links: " + insertError.message);
  }
}

async function saveItemSpec(
  orgId: string,
  itemId: string,
  spec: CatalogItemInput["spec"] | undefined,
): Promise<void> {
  const { supabase } = await requireCatalogOrgContext();
  const hasSpecValues =
    spec !== undefined &&
    (spec.lengthIn !== undefined ||
      spec.widthIn !== undefined ||
      spec.heightDepthIn !== undefined ||
      spec.spreadRateSqftPerInch !== undefined ||
      spec.faceFeet !== undefined ||
      (spec.extraSpecs !== undefined &&
        spec.extraSpecs !== null &&
        Object.keys(spec.extraSpecs).length > 0));

  if (!hasSpecValues) {
    const { error } = await supabase
      .from("catalog_item_specs")
      .delete()
      .eq("org_id", orgId)
      .eq("catalog_item_id", itemId);

    if (error) {
      throw new Error("Unable to clear item specs: " + error.message);
    }

    return;
  }

  const payload = {
    org_id: orgId,
    catalog_item_id: itemId,
    length_in: spec?.lengthIn ?? null,
    width_in: spec?.widthIn ?? null,
    height_depth_in: spec?.heightDepthIn ?? null,
    spread_rate_sqft_per_inch: spec?.spreadRateSqftPerInch ?? null,
    face_feet: spec?.faceFeet ?? null,
    extra_specs: spec?.extraSpecs ?? null,
  };

  const { error } = await supabase
    .from("catalog_item_specs")
    .upsert(payload, { onConflict: "catalog_item_id" });

  if (error) {
    throw new Error("Unable to save item specs: " + error.message);
  }
}

export async function getItems(
  filters: CatalogItemListFilters = {},
): Promise<CatalogItemListItem[]> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  let query = supabase.from("catalog_items").select("*").eq("org_id", orgId);

  if (filters.includeInactive !== true) {
    query = query.eq("is_active", true);
  }

  if (filters.search && filters.search.trim().length > 0) {
    const search = escapeForIlike(filters.search);
    query = query.or(
      "name.ilike.%" +
        search +
        "%,description.ilike.%" +
        search +
        "%,unit.ilike.%" +
        search +
        "%",
    );
  }

  if (filters.unit && filters.unit !== "all") {
    query = query.eq("unit", filters.unit);
  }

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load catalog items: " + error.message);
  }

  const rows = (data ?? []) as Record<string, unknown>[];
  const mapped = rows.map(mapItemRow);

  if (filters.needsReview) {
    return mapped
      .filter((item) => item.is_overdue)
      .sort((a, b) => b.days_overdue - a.days_overdue);
  }

  return mapped;
}

export async function getPriceReviewItems(): Promise<CatalogItemListItem[]> {
  return getItems({
    needsReview: true,
  });
}

export async function getItem(itemId: string): Promise<CatalogItemDetail | null> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { data: itemData, error: itemError } = await supabase
    .from("catalog_items")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", itemId)
    .maybeSingle();

  if (itemError) {
    throw new Error("Unable to load item details: " + itemError.message);
  }

  if (!itemData) {
    return null;
  }

  const { data: specData, error: specError } = await supabase
    .from("catalog_item_specs")
    .select("*")
    .eq("org_id", orgId)
    .eq("catalog_item_id", itemId)
    .maybeSingle();

  if (specError) {
    throw new Error("Unable to load item specs: " + specError.message);
  }

  const { data: supplierData, error: supplierError } = await supabase
    .from("catalog_item_suppliers")
    .select(
      "*,suppliers(name),supplier_locations(name)",
    )
    .eq("org_id", orgId)
    .eq("catalog_item_id", itemId)
    .order("is_preferred", { ascending: false })
    .order("created_at", { ascending: true });

  if (supplierError) {
    throw new Error("Unable to load supplier links: " + supplierError.message);
  }

  const item = mapItemRow(itemData as Record<string, unknown>);
  const spec = mapSpecRow(specData as Record<string, unknown> | null);
  const suppliers = ((supplierData ?? []) as Record<string, unknown>[]).map(
    mapSupplierLinkRow,
  );

  return {
    ...item,
    spec,
    suppliers,
  };
}

export async function getItemSupplierOptions(): Promise<ItemSupplierOption[]> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { data, error } = await supabase
    .from("suppliers")
    .select("id,name")
    .eq("org_id", orgId)
    .eq("is_active", true)
    .order("name", { ascending: true });

  if (error) {
    throw new Error("Unable to load supplier options: " + error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map((row) => ({
    id: String(row.id),
    name: String(row.name),
  }));
}

export async function createItem(input: CatalogItemInput): Promise<string> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const name = normalizeOptionalText(input.name);
  const unit = normalizeOptionalText(input.unit);

  if (name === null) {
    throw new Error("Item name is required.");
  }

  if (unit === null) {
    throw new Error("Unit is required.");
  }

  const insertPayload = {
    org_id: orgId,
    name,
    unit,
    description: normalizeOptionalText(input.description ?? null),
    default_cost: input.defaultCost ?? null,
    default_sell_price: input.defaultSellPrice ?? null,
    default_markup_pct: input.defaultMarkupPct ?? null,
    waste_pct: input.wastePct ?? 0,
    color: normalizeOptionalText(input.color ?? null),
    quantity_type: input.quantityType ?? "decimal",
    round_to: input.roundTo ?? null,
    minimum_qty: input.minimumQty ?? null,
    package_unit: normalizeOptionalText(input.packageUnit ?? null),
    price_review_frequency_days: input.priceReviewFrequencyDays ?? null,
    price_auto_increase_pct: input.priceAutoIncreasePct ?? null,
    price_auto_increase_months: input.priceAutoIncreaseMonths ?? null,
    is_active: input.isActive !== false,
    sort_order: input.sortOrder ?? 0,
  };

  const { data, error } = await supabase
    .from("catalog_items")
    .insert(insertPayload)
    .select("id")
    .single();

  if (error) {
    throw new Error("Unable to create item: " + error.message);
  }

  const itemId = String(data.id);
  await saveItemSpec(orgId, itemId, input.spec);
  await replaceSupplierLinks(orgId, itemId, input.suppliers);
  return itemId;
}

export async function updateItem(
  itemId: string,
  input: CatalogItemInput,
): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const name = normalizeOptionalText(input.name);
  const unit = normalizeOptionalText(input.unit);

  if (name === null) {
    throw new Error("Item name is required.");
  }

  if (unit === null) {
    throw new Error("Unit is required.");
  }

  const updatePayload = {
    name,
    unit,
    description: normalizeOptionalText(input.description ?? null),
    default_cost: input.defaultCost ?? null,
    default_sell_price: input.defaultSellPrice ?? null,
    default_markup_pct: input.defaultMarkupPct ?? null,
    waste_pct: input.wastePct ?? 0,
    color: normalizeOptionalText(input.color ?? null),
    quantity_type: input.quantityType ?? "decimal",
    round_to: input.roundTo ?? null,
    minimum_qty: input.minimumQty ?? null,
    package_unit: normalizeOptionalText(input.packageUnit ?? null),
    price_review_frequency_days: input.priceReviewFrequencyDays ?? null,
    price_auto_increase_pct: input.priceAutoIncreasePct ?? null,
    price_auto_increase_months: input.priceAutoIncreaseMonths ?? null,
    is_active: input.isActive !== false,
    sort_order: input.sortOrder ?? 0,
  };

  const { error } = await supabase
    .from("catalog_items")
    .update(updatePayload)
    .eq("org_id", orgId)
    .eq("id", itemId);

  if (error) {
    throw new Error("Unable to update item: " + error.message);
  }

  await saveItemSpec(orgId, itemId, input.spec);
  await replaceSupplierLinks(orgId, itemId, input.suppliers);
}

export async function deleteItem(itemId: string): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { error } = await supabase
    .from("catalog_items")
    .delete()
    .eq("org_id", orgId)
    .eq("id", itemId);

  if (error) {
    throw new Error("Unable to delete item: " + error.message);
  }
}

export async function markItemReviewed(itemId: string): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { error } = await supabase
    .from("catalog_items")
    .update({
      last_price_updated_at: todayYmd(),
    })
    .eq("org_id", orgId)
    .eq("id", itemId);

  if (error) {
    throw new Error("Unable to mark item as reviewed: " + error.message);
  }
}

export async function updateItemCost(
  itemId: string,
  cost: number,
): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { error } = await supabase
    .from("catalog_items")
    .update({
      default_cost: cost,
      last_price_updated_at: todayYmd(),
    })
    .eq("org_id", orgId)
    .eq("id", itemId);

  if (error) {
    throw new Error("Unable to update item cost: " + error.message);
  }
}

export async function listItemUnits(): Promise<string[]> {
  const items = await getItems({
    includeInactive: true,
  });

  return [...new Set(items.map((item) => item.unit))]
    .filter((unit) => unit.length > 0)
    .sort((a, b) => a.localeCompare(b));
}
