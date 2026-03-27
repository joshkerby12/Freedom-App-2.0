"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createItem,
  deleteItem,
  getPriceReviewItems,
  markItemReviewed,
  updateItem,
  updateItemCost,
} from "@/lib/catalog/catalog-service";
import type { CatalogItemInput } from "@/lib/catalog/types";
import type { CatalogItemFormActionState } from "@/app/(app)/catalog/items/item-types";

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
  if (value.length === 0) {
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

function normalizeQuantityType(value: string): "whole" | "decimal" {
  return value === "whole" ? "whole" : "decimal";
}

function normalizeItemInput(formData: FormData): CatalogItemInput {
  const extraSpecsRaw = readJsonArray<{ key: string; value: string }>(
    formData,
    "extraSpecsJson",
  );
  const supplierLinksRaw = readJsonArray<{
    supplierId: string;
    supplierLocationId?: string;
    supplierSku?: string;
    supplierItemName?: string;
    unitCost?: string;
    lastPriceDate?: string;
    isPreferred?: boolean;
  }>(formData, "supplierLinksJson");

  const extraSpecsEntries = extraSpecsRaw
    .map((entry) => ({
      key: entry.key.trim(),
      value: entry.value.trim(),
    }))
    .filter((entry) => entry.key.length > 0 && entry.value.length > 0)
    .map((entry) => {
      const numeric = Number(entry.value);
      return Number.isFinite(numeric)
        ? [entry.key, numeric]
        : [entry.key, entry.value];
    });

  return {
    name: readText(formData, "name"),
    unit: readText(formData, "unit"),
    description: readOptionalText(formData, "description"),
    defaultCost: readOptionalNumber(formData, "defaultCost"),
    defaultSellPrice: readOptionalNumber(formData, "defaultSellPrice"),
    defaultMarkupPct: readOptionalNumber(formData, "defaultMarkupPct"),
    wastePct: readOptionalNumber(formData, "wastePct") ?? 0,
    color: readOptionalText(formData, "color"),
    quantityType: normalizeQuantityType(readText(formData, "quantityType")),
    roundTo: readOptionalNumber(formData, "roundTo"),
    minimumQty: readOptionalNumber(formData, "minimumQty"),
    packageUnit: readOptionalText(formData, "packageUnit"),
    priceReviewFrequencyDays:
      readOptionalNumber(formData, "priceReviewFrequencyDays"),
    priceAutoIncreasePct: readOptionalNumber(formData, "priceAutoIncreasePct"),
    priceAutoIncreaseMonths: readOptionalNumber(formData, "priceAutoIncreaseMonths"),
    isActive: readBoolean(formData, "isActive"),
    spec: {
      lengthIn: readOptionalNumber(formData, "lengthIn"),
      widthIn: readOptionalNumber(formData, "widthIn"),
      heightDepthIn: readOptionalNumber(formData, "heightDepthIn"),
      spreadRateSqftPerInch: readOptionalNumber(formData, "spreadRateSqftPerInch"),
      faceFeet: readOptionalNumber(formData, "faceFeet"),
      extraSpecs:
        extraSpecsEntries.length > 0
          ? Object.fromEntries(extraSpecsEntries)
          : null,
    },
    suppliers: supplierLinksRaw
      .map((supplier) => ({
        supplierId: supplier.supplierId.trim(),
        supplierLocationId: supplier.supplierLocationId?.trim() ?? null,
        supplierSku: supplier.supplierSku?.trim() ?? null,
        supplierItemName: supplier.supplierItemName?.trim() ?? null,
        unitCost:
          supplier.unitCost && supplier.unitCost.trim().length > 0
            ? Number(supplier.unitCost)
            : null,
        lastPriceDate: supplier.lastPriceDate?.trim() ?? null,
        isPreferred: supplier.isPreferred === true,
      }))
      .filter((supplier) => supplier.supplierId.length > 0),
  };
}

function parseError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function createItemAction(
  _previousState: CatalogItemFormActionState,
  formData: FormData,
): Promise<CatalogItemFormActionState> {
  const payload = normalizeItemInput(formData);

  try {
    const itemId = await createItem(payload);

    revalidatePath("/catalog/items");
    revalidatePath("/catalog/items/new");
    revalidatePath("/catalog/items/" + itemId);
    revalidatePath("/catalog/products/new");
    revalidatePath("/catalog/configurations/new");
    redirect("/catalog/items/" + itemId);
  } catch (error) {
    return {
      error: parseError(error, "Unable to create item."),
    };
  }
}

export async function updateItemAction(
  itemId: string,
  _previousState: CatalogItemFormActionState,
  formData: FormData,
): Promise<CatalogItemFormActionState> {
  const payload = normalizeItemInput(formData);

  try {
    await updateItem(itemId, payload);

    revalidatePath("/catalog/items");
    revalidatePath("/catalog/items/" + itemId);
    revalidatePath("/catalog/items/" + itemId + "/edit");
    revalidatePath("/catalog/products/new");
    revalidatePath("/catalog/configurations/new");
    redirect("/catalog/items/" + itemId);
  } catch (error) {
    return {
      error: parseError(error, "Unable to update item."),
    };
  }
}

export async function deleteItemAction(itemId: string): Promise<void> {
  try {
    await deleteItem(itemId);
    revalidatePath("/catalog/items");
    revalidatePath("/catalog/products");
    revalidatePath("/catalog/configurations");
  } catch (error) {
    const message = parseError(error, "Unable to delete item.");
    redirect("/catalog/items/" + itemId + "?error=" + encodeURIComponent(message));
  }

  redirect("/catalog/items?saved=deleted");
}

export async function markItemReviewedAction(itemId: string): Promise<void> {
  await markItemReviewed(itemId);
  revalidatePath("/catalog/items");
  revalidatePath("/catalog/items/" + itemId);
}

export async function markAllItemsReviewedAction(): Promise<void> {
  const items = await getPriceReviewItems();
  await Promise.all(items.map((item) => markItemReviewed(item.id)));
  revalidatePath("/catalog/items");
}

export async function updateItemCostAction(
  itemId: string,
  _previousState: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const costRaw = readText(formData, "defaultCost");
  if (!costRaw) {
    return {
      error: "Default cost is required.",
    };
  }

  const parsed = Number(costRaw);
  if (!Number.isFinite(parsed)) {
    return {
      error: "Default cost must be a valid number.",
    };
  }

  try {
    await updateItemCost(itemId, parsed);
    revalidatePath("/catalog/items");
    revalidatePath("/catalog/items/" + itemId);
    return {
      error: null,
    };
  } catch (error) {
    return {
      error: parseError(error, "Unable to update cost."),
    };
  }
}
