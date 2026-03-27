import { requireCatalogOrgContext } from "@/lib/catalog/org-context";
import type {
  SupplierDetail,
  SupplierInput,
  SupplierListItem,
  SupplierLocationInput,
  SupplierLocationRecord,
} from "@/lib/catalog/types";

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

function mapLocationRow(row: Record<string, unknown>): SupplierLocationRecord {
  return {
    id: String(row.id),
    supplier_id: String(row.supplier_id),
    name: String(row.name),
    street_address: asString(row.street_address),
    city: asString(row.city),
    state: asString(row.state),
    zip: asString(row.zip),
    lat: asNumber(row.lat),
    lng: asNumber(row.lng),
    phone: asString(row.phone),
    is_primary: asBoolean(row.is_primary),
    is_active: asBoolean(row.is_active),
  };
}

function deriveLocationName(
  location: SupplierLocationInput,
  index: number,
): string {
  const explicitName = normalizeOptionalText(location.name ?? null);
  if (explicitName) {
    return explicitName;
  }

  const city = normalizeOptionalText(location.city ?? null);
  const state = normalizeOptionalText(location.state ?? null);

  if (city && state) {
    return city + ", " + state;
  }

  if (city) {
    return city;
  }

  return index === 0 ? "Primary Location" : "Location " + String(index + 1);
}

function normalizeLocations(
  locations: SupplierLocationInput[] | undefined,
): SupplierLocationInput[] {
  if (!locations || locations.length === 0) {
    return [];
  }

  let primaryChosen = false;
  return locations
    .map((location, index) => {
      const derivedName = deriveLocationName(location, index);
      const shouldBePrimary = location.isPrimary === true && primaryChosen === false;
      if (shouldBePrimary) {
        primaryChosen = true;
      }

      return {
        id: location.id,
        name: derivedName,
        streetAddress: normalizeOptionalText(location.streetAddress ?? null),
        city: normalizeOptionalText(location.city ?? null),
        state: normalizeOptionalText(location.state ?? null),
        zip: normalizeOptionalText(location.zip ?? null),
        lat: location.lat ?? null,
        lng: location.lng ?? null,
        phone: normalizeOptionalText(location.phone ?? null),
        isPrimary: shouldBePrimary,
        isActive: location.isActive !== false,
      };
    })
    .filter((location) => location.name.length > 0);
}

async function replaceSupplierLocations(
  orgId: string,
  supplierId: string,
  locations: SupplierLocationInput[] | undefined,
): Promise<void> {
  const { supabase } = await requireCatalogOrgContext();
  const normalized = normalizeLocations(locations);

  const { error: deleteError } = await supabase
    .from("supplier_locations")
    .delete()
    .eq("org_id", orgId)
    .eq("supplier_id", supplierId);

  if (deleteError) {
    throw new Error("Unable to update locations: " + deleteError.message);
  }

  if (normalized.length === 0) {
    return;
  }

  const payload = normalized.map((location) => ({
    org_id: orgId,
    supplier_id: supplierId,
    name: location.name,
    street_address: location.streetAddress ?? null,
    city: location.city ?? null,
    state: location.state ?? null,
    zip: location.zip ?? null,
    lat: location.lat ?? null,
    lng: location.lng ?? null,
    phone: location.phone ?? null,
    is_primary: location.isPrimary === true,
    is_active: location.isActive !== false,
  }));

  const { error: insertError } = await supabase
    .from("supplier_locations")
    .insert(payload);

  if (insertError) {
    throw new Error("Unable to save locations: " + insertError.message);
  }
}

export async function getSuppliers(
  search?: string,
): Promise<SupplierListItem[]> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  let query = supabase
    .from("suppliers")
    .select("id,name,contact_name,phone,email,website,is_active")
    .eq("org_id", orgId)
    .order("name", { ascending: true });

  if (search && search.trim()) {
    const term = escapeForIlike(search);
    query = query.or("name.ilike.%" + term + "%,contact_name.ilike.%" + term + "%");
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load suppliers: " + error.message);
  }

  const rows = (data ?? []) as Array<Record<string, unknown>>;
  const supplierIds = rows.map((row) => String(row.id));

  const locationCountBySupplierId = new Map<string, number>();
  if (supplierIds.length > 0) {
    const { data: locations, error: locationError } = await supabase
      .from("supplier_locations")
      .select("supplier_id")
      .eq("org_id", orgId)
      .in("supplier_id", supplierIds);

    if (locationError) {
      throw new Error("Unable to load supplier locations: " + locationError.message);
    }

    for (const location of (locations ?? []) as Array<Record<string, unknown>>) {
      const supplierId = String(location.supplier_id);
      const current = locationCountBySupplierId.get(supplierId) ?? 0;
      locationCountBySupplierId.set(supplierId, current + 1);
    }
  }

  return rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    contact_name: asString(row.contact_name),
    phone: asString(row.phone),
    email: asString(row.email),
    website: asString(row.website),
    is_active: asBoolean(row.is_active),
    location_count: locationCountBySupplierId.get(String(row.id)) ?? 0,
  }));
}

export async function getSupplier(
  supplierId: string,
): Promise<SupplierDetail | null> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { data: supplier, error: supplierError } = await supabase
    .from("suppliers")
    .select("id,name,contact_name,phone,email,website,is_active")
    .eq("org_id", orgId)
    .eq("id", supplierId)
    .maybeSingle();

  if (supplierError) {
    throw new Error("Unable to load supplier: " + supplierError.message);
  }

  if (!supplier) {
    return null;
  }

  const { data: locationData, error: locationError } = await supabase
    .from("supplier_locations")
    .select("*")
    .eq("org_id", orgId)
    .eq("supplier_id", supplierId)
    .order("is_primary", { ascending: false })
    .order("name", { ascending: true });

  if (locationError) {
    throw new Error("Unable to load supplier locations: " + locationError.message);
  }

  const { data: itemLinks, error: itemError } = await supabase
    .from("catalog_item_suppliers")
    .select("id,unit_cost,is_preferred,catalog_items(id,name,unit)")
    .eq("org_id", orgId)
    .eq("supplier_id", supplierId)
    .order("is_preferred", { ascending: false });

  if (itemError) {
    throw new Error("Unable to load items carried: " + itemError.message);
  }

  const locations = ((locationData ?? []) as Array<Record<string, unknown>>).map(
    mapLocationRow,
  );

  const itemsCarried = ((itemLinks ?? []) as Array<Record<string, unknown>>)
    .map((link) => {
      const joined = Array.isArray(link.catalog_items)
        ? (link.catalog_items[0] as Record<string, unknown> | undefined)
        : (link.catalog_items as Record<string, unknown> | null);

      if (!joined || !joined.id || !joined.name || !joined.unit) {
        return null;
      }

      return {
        id: String(joined.id),
        name: String(joined.name),
        unit: String(joined.unit),
        unit_cost: asNumber(link.unit_cost),
        is_preferred: asBoolean(link.is_preferred),
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    id: String(supplier.id),
    name: String(supplier.name),
    contact_name: asString(supplier.contact_name),
    phone: asString(supplier.phone),
    email: asString(supplier.email),
    website: asString(supplier.website),
    is_active: asBoolean(supplier.is_active),
    location_count: locations.length,
    locations,
    itemsCarried,
  };
}

export async function createSupplier(input: SupplierInput): Promise<string> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const name = normalizeOptionalText(input.name);
  if (name === null) {
    throw new Error("Supplier name is required.");
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      org_id: orgId,
      name,
      contact_name: normalizeOptionalText(input.contactName ?? null),
      phone: normalizeOptionalText(input.phone ?? null),
      email: normalizeOptionalText(input.email ?? null),
      website: normalizeOptionalText(input.website ?? null),
      is_active: input.isActive !== false,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("Unable to create supplier: " + error.message);
  }

  const supplierId = String(data.id);
  await replaceSupplierLocations(orgId, supplierId, input.locations);
  return supplierId;
}

export async function updateSupplier(
  supplierId: string,
  input: SupplierInput,
): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const name = normalizeOptionalText(input.name);
  if (name === null) {
    throw new Error("Supplier name is required.");
  }

  const { error } = await supabase
    .from("suppliers")
    .update({
      name,
      contact_name: normalizeOptionalText(input.contactName ?? null),
      phone: normalizeOptionalText(input.phone ?? null),
      email: normalizeOptionalText(input.email ?? null),
      website: normalizeOptionalText(input.website ?? null),
      is_active: input.isActive !== false,
    })
    .eq("org_id", orgId)
    .eq("id", supplierId);

  if (error) {
    throw new Error("Unable to update supplier: " + error.message);
  }

  await replaceSupplierLocations(orgId, supplierId, input.locations);
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { error } = await supabase
    .from("suppliers")
    .delete()
    .eq("org_id", orgId)
    .eq("id", supplierId);

  if (error) {
    throw new Error("Unable to delete supplier: " + error.message);
  }
}

export async function addLocation(
  supplierId: string,
  location: SupplierLocationInput,
): Promise<void> {
  const detail = await getSupplier(supplierId);
  if (detail === null) {
    throw new Error("Supplier not found.");
  }

  const nextLocations = [
    ...detail.locations.map((entry) => ({
      id: entry.id,
      name: entry.name,
      streetAddress: entry.street_address,
      city: entry.city,
      state: entry.state,
      zip: entry.zip,
      lat: entry.lat,
      lng: entry.lng,
      phone: entry.phone,
      isPrimary: entry.is_primary,
      isActive: entry.is_active,
    })),
    location,
  ];

  await updateSupplier(supplierId, {
    name: detail.name,
    contactName: detail.contact_name,
    phone: detail.phone,
    email: detail.email,
    website: detail.website,
    isActive: detail.is_active,
    locations: nextLocations,
  });
}

export async function updateLocation(
  supplierId: string,
  locationId: string,
  location: SupplierLocationInput,
): Promise<void> {
  const detail = await getSupplier(supplierId);
  if (detail === null) {
    throw new Error("Supplier not found.");
  }

  const nextLocations = detail.locations.map((entry) => {
    if (entry.id !== locationId) {
      return {
        id: entry.id,
        name: entry.name,
        streetAddress: entry.street_address,
        city: entry.city,
        state: entry.state,
        zip: entry.zip,
        lat: entry.lat,
        lng: entry.lng,
        phone: entry.phone,
        isPrimary: entry.is_primary,
        isActive: entry.is_active,
      };
    }

    return {
      id: entry.id,
      name: location.name ?? entry.name,
      streetAddress: location.streetAddress ?? entry.street_address,
      city: location.city ?? entry.city,
      state: location.state ?? entry.state,
      zip: location.zip ?? entry.zip,
      lat: location.lat ?? entry.lat,
      lng: location.lng ?? entry.lng,
      phone: location.phone ?? entry.phone,
      isPrimary: location.isPrimary ?? entry.is_primary,
      isActive: location.isActive ?? entry.is_active,
    };
  });

  await updateSupplier(supplierId, {
    name: detail.name,
    contactName: detail.contact_name,
    phone: detail.phone,
    email: detail.email,
    website: detail.website,
    isActive: detail.is_active,
    locations: nextLocations,
  });
}

export async function deleteLocation(
  supplierId: string,
  locationId: string,
): Promise<void> {
  const detail = await getSupplier(supplierId);
  if (detail === null) {
    throw new Error("Supplier not found.");
  }

  const nextLocations = detail.locations
    .filter((entry) => entry.id !== locationId)
    .map((entry) => ({
      id: entry.id,
      name: entry.name,
      streetAddress: entry.street_address,
      city: entry.city,
      state: entry.state,
      zip: entry.zip,
      lat: entry.lat,
      lng: entry.lng,
      phone: entry.phone,
      isPrimary: entry.is_primary,
      isActive: entry.is_active,
    }));

  await updateSupplier(supplierId, {
    name: detail.name,
    contactName: detail.contact_name,
    phone: detail.phone,
    email: detail.email,
    website: detail.website,
    isActive: detail.is_active,
    locations: nextLocations,
  });
}
