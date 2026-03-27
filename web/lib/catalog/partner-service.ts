import { requireCatalogOrgContext } from "@/lib/catalog/org-context";
import type { PartnerInput, PartnerRecord } from "@/lib/catalog/types";

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

function mapPartnerRow(row: Record<string, unknown>): PartnerRecord {
  return {
    id: String(row.id),
    company_name: String(row.company_name),
    contact_name: asString(row.contact_name),
    phone: asString(row.phone),
    email: asString(row.email),
    trade_type: asString(row.trade_type),
    notes: asString(row.notes),
    is_active: asBoolean(row.is_active),
  };
}

export async function getPartners(search?: string): Promise<PartnerRecord[]> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  let query = supabase
    .from("partners")
    .select("*")
    .eq("org_id", orgId)
    .order("company_name", { ascending: true });

  if (search && search.trim()) {
    const term = escapeForIlike(search);
    query = query.or("company_name.ilike.%" + term + "%,trade_type.ilike.%" + term + "%");
  }

  const { data, error } = await query;
  if (error) {
    throw new Error("Unable to load partners: " + error.message);
  }

  return ((data ?? []) as Array<Record<string, unknown>>).map(mapPartnerRow);
}

export async function getPartner(partnerId: string): Promise<PartnerRecord | null> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("org_id", orgId)
    .eq("id", partnerId)
    .maybeSingle();

  if (error) {
    throw new Error("Unable to load partner: " + error.message);
  }

  if (!data) {
    return null;
  }

  return mapPartnerRow(data as Record<string, unknown>);
}

export async function createPartner(input: PartnerInput): Promise<string> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const companyName = normalizeOptionalText(input.companyName);
  if (companyName === null) {
    throw new Error("Company name is required.");
  }

  const { data, error } = await supabase
    .from("partners")
    .insert({
      org_id: orgId,
      company_name: companyName,
      contact_name: normalizeOptionalText(input.contactName ?? null),
      phone: normalizeOptionalText(input.phone ?? null),
      email: normalizeOptionalText(input.email ?? null),
      trade_type: normalizeOptionalText(input.tradeType ?? null),
      notes: normalizeOptionalText(input.notes ?? null),
      is_active: input.isActive !== false,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error("Unable to create partner: " + error.message);
  }

  return String(data.id);
}

export async function updatePartner(
  partnerId: string,
  input: PartnerInput,
): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();
  const companyName = normalizeOptionalText(input.companyName);
  if (companyName === null) {
    throw new Error("Company name is required.");
  }

  const { error } = await supabase
    .from("partners")
    .update({
      company_name: companyName,
      contact_name: normalizeOptionalText(input.contactName ?? null),
      phone: normalizeOptionalText(input.phone ?? null),
      email: normalizeOptionalText(input.email ?? null),
      trade_type: normalizeOptionalText(input.tradeType ?? null),
      notes: normalizeOptionalText(input.notes ?? null),
      is_active: input.isActive !== false,
    })
    .eq("org_id", orgId)
    .eq("id", partnerId);

  if (error) {
    throw new Error("Unable to update partner: " + error.message);
  }
}

export async function deletePartner(partnerId: string): Promise<void> {
  const { supabase, orgId } = await requireCatalogOrgContext();

  const { error } = await supabase
    .from("partners")
    .delete()
    .eq("org_id", orgId)
    .eq("id", partnerId);

  if (error) {
    throw new Error("Unable to delete partner: " + error.message);
  }
}
