"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createSupplier,
  deleteSupplier,
  updateSupplier,
} from "@/lib/catalog/supplier-service";
import type { SupplierInput, SupplierLocationInput } from "@/lib/catalog/types";
import type { SupplierFormActionState } from "@/app/(app)/catalog/suppliers/supplier-types";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalText(formData: FormData, key: string): string | null {
  const value = readText(formData, key);
  return value.length > 0 ? value : null;
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value !== "string") {
    return null;
  }

  if (!value.trim()) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readJsonArray<T>(formData: FormData, key: string): T[] {
  const raw = formData.get(key);
  if (typeof raw !== "string" || raw.trim().length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function normalizeLocations(formData: FormData): SupplierLocationInput[] {
  const rawLocations = readJsonArray<{
    name?: string;
    streetAddress?: string;
    city?: string;
    state?: string;
    zip?: string;
    lat?: string;
    lng?: string;
    phone?: string;
    isPrimary?: boolean;
    isActive?: boolean;
  }>(formData, "locationsJson");

  return rawLocations
    .map((location) => ({
      name: location.name?.trim() || null,
      streetAddress: location.streetAddress?.trim() || null,
      city: location.city?.trim() || null,
      state: location.state?.trim() || null,
      zip: location.zip?.trim() || null,
      lat: parseOptionalNumber(location.lat),
      lng: parseOptionalNumber(location.lng),
      phone: location.phone?.trim() || null,
      isPrimary: location.isPrimary === true,
      isActive: location.isActive !== false,
    }))
    .filter((location) => {
      return (
        location.name !== null ||
        location.streetAddress !== null ||
        location.city !== null ||
        location.state !== null ||
        location.zip !== null ||
        location.lat !== null ||
        location.lng !== null
      );
    });
}

function buildSupplierInput(formData: FormData): SupplierInput {
  return {
    name: readText(formData, "name"),
    contactName: readOptionalText(formData, "contactName"),
    phone: readOptionalText(formData, "phone"),
    email: readOptionalText(formData, "email"),
    website: readOptionalText(formData, "website"),
    isActive: readBoolean(formData, "isActive"),
    locations: normalizeLocations(formData),
  };
}

function parseError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function createSupplierAction(
  _previousState: SupplierFormActionState,
  formData: FormData,
): Promise<SupplierFormActionState> {
  const payload = buildSupplierInput(formData);

  try {
    const supplierId = await createSupplier(payload);
    revalidatePath("/catalog/suppliers");
    revalidatePath("/catalog/items");
    redirect(`/catalog/suppliers/${supplierId}`);
  } catch (error) {
    return {
      error: parseError(error, "Unable to create supplier."),
    };
  }
}

export async function updateSupplierAction(
  supplierId: string,
  _previousState: SupplierFormActionState,
  formData: FormData,
): Promise<SupplierFormActionState> {
  const payload = buildSupplierInput(formData);

  try {
    await updateSupplier(supplierId, payload);
    revalidatePath("/catalog/suppliers");
    revalidatePath(`/catalog/suppliers/${supplierId}`);
    revalidatePath(`/catalog/suppliers/${supplierId}/edit`);
    revalidatePath("/catalog/items");
    redirect(`/catalog/suppliers/${supplierId}?saved=updated`);
  } catch (error) {
    return {
      error: parseError(error, "Unable to update supplier."),
    };
  }
}

export async function deleteSupplierAction(supplierId: string): Promise<void> {
  try {
    await deleteSupplier(supplierId);
    revalidatePath("/catalog/suppliers");
    revalidatePath("/catalog/items");
  } catch (error) {
    const message = parseError(error, "Unable to delete supplier.");
    redirect(`/catalog/suppliers/${supplierId}?error=${encodeURIComponent(message)}`);
  }

  redirect("/catalog/suppliers?saved=deleted");
}
