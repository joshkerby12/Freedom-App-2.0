"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/lib/catalog/product-catalog-service";
import type {
  MaterialConfigType,
  ProductCatalogComponentInput,
  ProductCatalogInput,
  ProductCatalogInputInput,
  ProductCategory,
  ProductComponentType,
  ProductInputType,
  ProductPricingMode,
} from "@/lib/catalog/types";
import type { ProductFormActionState } from "@/app/(app)/catalog/products/product-types";

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

function readOptionalNumber(formData: FormData, key: string): number | null {
  const value = readText(formData, key);
  if (!value) {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function readJsonArray<T>(formData: FormData, key: string): T[] {
  const raw = formData.get(key);
  if (typeof raw !== "string" || !raw.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

function normalizeCategory(value: string): ProductCategory {
  if (
    value === "hardscape" ||
    value === "softscape" ||
    value === "drainage" ||
    value === "irrigation" ||
    value === "maintenance" ||
    value === "snow" ||
    value === "other"
  ) {
    return value;
  }

  return "other";
}

function normalizePricingMode(value: string): ProductPricingMode {
  if (
    value === "cost_plus" ||
    value === "flat_rate" ||
    value === "per_sf" ||
    value === "t_and_m"
  ) {
    return value;
  }

  return "cost_plus";
}

function normalizeInputType(value: string): ProductInputType {
  if (
    value === "number" ||
    value === "item_dropdown" ||
    value === "color_dropdown" ||
    value === "config_dropdown" ||
    value === "custom_dropdown" ||
    value === "text"
  ) {
    return value;
  }

  return "number";
}

function normalizeComponentType(value: string): ProductComponentType {
  if (
    value === "catalog_item" ||
    value === "material_configuration" ||
    value === "labor" ||
    value === "equipment" ||
    value === "partner"
  ) {
    return value;
  }

  return "catalog_item";
}

function normalizeConfigType(value: string): MaterialConfigType | null {
  if (
    value === "paver_patio" ||
    value === "wall" ||
    value === "flagstone" ||
    value === "mulch_bed" ||
    value === "sod" ||
    value === "rock_bed" ||
    value === "turf"
  ) {
    return value;
  }

  return null;
}

function parseInputs(formData: FormData): ProductCatalogInputInput[] {
  const rawInputs = readJsonArray<{
    label: string;
    inputType: string;
    unitLabel?: string;
    isRequired?: boolean;
    defaultValue?: string;
    customOptions?: string[];
    configTypeFilter?: string;
  }>(formData, "inputsJson");

  return rawInputs.map((input, index) => ({
    label: input.label,
    inputType: normalizeInputType(input.inputType),
    unitLabel: input.unitLabel?.trim() || null,
    isRequired: input.isRequired !== false,
    defaultValue: input.defaultValue?.trim() || null,
    customOptions:
      input.customOptions
        ?.map((option) => option.trim())
        .filter((option) => option.length > 0) ?? null,
    configTypeFilter: normalizeConfigType(input.configTypeFilter ?? ""),
    sortOrder: index,
  }));
}

function parseComponents(formData: FormData): ProductCatalogComponentInput[] {
  const rawComponents = readJsonArray<{
    label: string;
    componentType: string;
    catalogItemId?: string;
    inputRef?: string;
    configurationInputRef?: string;
    qtyFormula: string;
  }>(formData, "componentsJson");

  return rawComponents.map((component, index) => ({
    label: component.label,
    componentType: normalizeComponentType(component.componentType),
    catalogItemId: component.catalogItemId?.trim() || null,
    inputRef: component.inputRef?.trim() || null,
    configurationInputRef: component.configurationInputRef?.trim() || null,
    qtyFormula: component.qtyFormula,
    sortOrder: index,
  }));
}

function buildPayload(formData: FormData): ProductCatalogInput {
  return {
    name: readText(formData, "name"),
    category: normalizeCategory(readText(formData, "category")),
    pricingMode: normalizePricingMode(readText(formData, "pricingMode")),
    installRate: readOptionalNumber(formData, "installRate"),
    minimumHours: readOptionalNumber(formData, "minimumHours"),
    flatRatePrice: readOptionalNumber(formData, "flatRatePrice"),
    laborRateOverride: readOptionalNumber(formData, "laborRateOverride"),
    equipmentRateOverride: readOptionalNumber(formData, "equipmentRateOverride"),
    defaultDescription: readOptionalText(formData, "defaultDescription"),
    quickbooksItemCode: readOptionalText(formData, "quickbooksItemCode"),
    isActive: readBoolean(formData, "isActive"),
    inputs: parseInputs(formData),
    components: parseComponents(formData),
  };
}

function parseError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function createProductAction(
  _previousState: ProductFormActionState,
  formData: FormData,
): Promise<ProductFormActionState> {
  const payload = buildPayload(formData);

  try {
    const productId = await createProduct(payload);
    revalidatePath("/catalog/products");
    revalidatePath("/catalog/products/new");
    redirect(`/catalog/products/${productId}?saved=created`);
  } catch (error) {
    return {
      error: parseError(error, "Unable to create product."),
    };
  }
}

export async function updateProductAction(
  productId: string,
  _previousState: ProductFormActionState,
  formData: FormData,
): Promise<ProductFormActionState> {
  const payload = buildPayload(formData);

  try {
    await updateProduct(productId, payload);
    revalidatePath("/catalog/products");
    revalidatePath(`/catalog/products/${productId}`);
    revalidatePath(`/catalog/products/${productId}/edit`);
    redirect(`/catalog/products/${productId}?saved=updated`);
  } catch (error) {
    return {
      error: parseError(error, "Unable to update product."),
    };
  }
}

export async function deleteProductAction(productId: string): Promise<void> {
  try {
    await deleteProduct(productId);
    revalidatePath("/catalog/products");
  } catch (error) {
    const message = parseError(error, "Unable to delete product.");
    redirect(`/catalog/products/${productId}?error=${encodeURIComponent(message)}`);
  }

  redirect("/catalog/products?saved=deleted");
}
