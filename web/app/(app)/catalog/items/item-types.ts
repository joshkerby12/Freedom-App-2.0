import type { CatalogItemDetail } from "@/lib/catalog/types";

export type CatalogItemFormActionState = {
  error: string | null;
};

export const initialCatalogItemFormActionState: CatalogItemFormActionState = {
  error: null,
};

export type EditableExtraSpec = {
  key: string;
  value: string;
};

export type EditableSupplierLink = {
  supplierId: string;
  supplierLocationId: string;
  supplierSku: string;
  supplierItemName: string;
  unitCost: string;
  lastPriceDate: string;
  isPreferred: boolean;
};

export function getInitialExtraSpecs(
  item?: CatalogItemDetail,
): EditableExtraSpec[] {
  const source = item?.spec?.extra_specs;
  if (!source || Object.keys(source).length === 0) {
    return [{ key: "", value: "" }];
  }

  const entries = Object.entries(source).map(([key, value]) => ({
    key,
    value: String(value),
  }));

  return entries.length > 0 ? entries : [{ key: "", value: "" }];
}

export function getInitialSupplierLinks(
  item?: CatalogItemDetail,
): EditableSupplierLink[] {
  if (!item || item.suppliers.length === 0) {
    return [
      {
        supplierId: "",
        supplierLocationId: "",
        supplierSku: "",
        supplierItemName: "",
        unitCost: "",
        lastPriceDate: "",
        isPreferred: false,
      },
    ];
  }

  return item.suppliers.map((supplier) => ({
    supplierId: supplier.supplier_id,
    supplierLocationId: supplier.supplier_location_id ?? "",
    supplierSku: supplier.supplier_sku ?? "",
    supplierItemName: supplier.supplier_item_name ?? "",
    unitCost: supplier.unit_cost === null ? "" : String(supplier.unit_cost),
    lastPriceDate: supplier.last_price_date ?? "",
    isPreferred: supplier.is_preferred,
  }));
}
