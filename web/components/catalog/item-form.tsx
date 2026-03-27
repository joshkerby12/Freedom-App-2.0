"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  CatalogItemFormActionState,
  EditableExtraSpec,
  EditableSupplierLink,
} from "@/app/(app)/catalog/items/item-types";
import {
  getInitialExtraSpecs,
  getInitialSupplierLinks,
  initialCatalogItemFormActionState,
} from "@/app/(app)/catalog/items/item-types";
import type { CatalogItemDetail } from "@/lib/catalog/types";

type ItemFormAction = (
  previousState: CatalogItemFormActionState,
  formData: FormData,
) => Promise<CatalogItemFormActionState>;

type ItemFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: ItemFormAction;
  supplierOptions: Array<{ id: string; name: string }>;
  initialItem?: CatalogItemDetail;
};

function emptyExtraSpec(): EditableExtraSpec {
  return {
    key: "",
    value: "",
  };
}

function emptySupplierLink(): EditableSupplierLink {
  return {
    supplierId: "",
    supplierLocationId: "",
    supplierSku: "",
    supplierItemName: "",
    unitCost: "",
    lastPriceDate: "",
    isPreferred: false,
  };
}

export function ItemForm({
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  supplierOptions,
  initialItem,
}: ItemFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialCatalogItemFormActionState,
  );
  const [extraSpecs, setExtraSpecs] = useState<EditableExtraSpec[]>(
    getInitialExtraSpecs(initialItem),
  );
  const [supplierLinks, setSupplierLinks] = useState<EditableSupplierLink[]>(
    getInitialSupplierLinks(initialItem),
  );
  const [defaultSellPrice, setDefaultSellPrice] = useState(
    initialItem?.default_sell_price === null ||
      initialItem?.default_sell_price === undefined
      ? ""
      : String(initialItem.default_sell_price),
  );

  const hasDefaultSellPrice = useMemo(
    () => defaultSellPrice.trim().length > 0,
    [defaultSellPrice],
  );

  function updateExtraSpec(index: number, patch: Partial<EditableExtraSpec>) {
    setExtraSpecs((current) =>
      current.map((entry, entryIndex) =>
        entryIndex === index ? { ...entry, ...patch } : entry,
      ),
    );
  }

  function addExtraSpec() {
    setExtraSpecs((current) => [...current, emptyExtraSpec()]);
  }

  function removeExtraSpec(index: number) {
    setExtraSpecs((current) => {
      const filtered = current.filter((_, entryIndex) => entryIndex !== index);
      return filtered.length > 0 ? filtered : [emptyExtraSpec()];
    });
  }

  function updateSupplierLink(
    index: number,
    patch: Partial<EditableSupplierLink>,
  ) {
    setSupplierLinks((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== index) {
          return patch.isPreferred ? { ...entry, isPreferred: false } : entry;
        }

        return { ...entry, ...patch };
      }),
    );
  }

  function addSupplierLink() {
    setSupplierLinks((current) => [...current, emptySupplierLink()]);
  }

  function removeSupplierLink(index: number) {
    setSupplierLinks((current) => {
      const filtered = current.filter((_, entryIndex) => entryIndex !== index);
      return filtered.length > 0 ? filtered : [emptySupplierLink()];
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="extraSpecsJson" value={JSON.stringify(extraSpecs)} />
          <input
            type="hidden"
            name="supplierLinksJson"
            value={JSON.stringify(supplierLinks)}
          />

          <section className="grid gap-4 md:grid-cols-2">
            <Input
              name="name"
              label="Item Name"
              required
              defaultValue={initialItem?.name ?? ""}
            />
            <Input
              name="unit"
              label="Unit"
              required
              defaultValue={initialItem?.unit ?? ""}
              placeholder="yard, sf, each"
            />
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Description
              <textarea
                name="description"
                defaultValue={initialItem?.description ?? ""}
                rows={3}
                className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-body)]"
              />
            </label>
            <Input
              name="defaultCost"
              label="Default Cost"
              type="number"
              step="0.01"
              defaultValue={
                initialItem?.default_cost === null || initialItem?.default_cost === undefined
                  ? ""
                  : String(initialItem.default_cost)
              }
            />
            <Input
              name="defaultSellPrice"
              label="Default Sell Price"
              type="number"
              step="0.01"
              value={defaultSellPrice}
              onChange={(event) => setDefaultSellPrice(event.target.value)}
            />
            <Input
              name="defaultMarkupPct"
              label="Default Markup %"
              type="number"
              step="0.01"
              defaultValue={
                initialItem?.default_markup_pct === null ||
                initialItem?.default_markup_pct === undefined
                  ? ""
                  : String(initialItem.default_markup_pct)
              }
            />
            <Input
              name="wastePct"
              label="Waste %"
              type="number"
              step="0.01"
              defaultValue={String(initialItem?.waste_pct ?? 0)}
            />
            {hasDefaultSellPrice ? (
              <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)] md:col-span-2">
                Sell price is set, so markup is ignored for pricing calculations.
              </p>
            ) : null}
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            <Input name="color" label="Color" defaultValue={initialItem?.color ?? ""} />
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Quantity Type
              <select
                name="quantityType"
                defaultValue={initialItem?.quantity_type ?? "decimal"}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                <option value="decimal">Decimal</option>
                <option value="whole">Whole</option>
              </select>
            </label>
            <Input
              name="roundTo"
              label="Round To"
              type="number"
              step="0.01"
              defaultValue={
                initialItem?.round_to === null || initialItem?.round_to === undefined
                  ? ""
                  : String(initialItem.round_to)
              }
            />
            <Input
              name="minimumQty"
              label="Minimum Quantity"
              type="number"
              step="0.01"
              defaultValue={
                initialItem?.minimum_qty === null || initialItem?.minimum_qty === undefined
                  ? ""
                  : String(initialItem.minimum_qty)
              }
            />
            <Input
              name="packageUnit"
              label="Package Unit"
              defaultValue={initialItem?.package_unit ?? ""}
            />
            <Input
              name="priceReviewFrequencyDays"
              label="Price Review Frequency (days)"
              type="number"
              step="1"
              defaultValue={
                initialItem?.price_review_frequency_days === null ||
                initialItem?.price_review_frequency_days === undefined
                  ? ""
                  : String(initialItem.price_review_frequency_days)
              }
            />
            <Input
              name="priceAutoIncreasePct"
              label="Auto Increase %"
              type="number"
              step="0.01"
              defaultValue={
                initialItem?.price_auto_increase_pct === null ||
                initialItem?.price_auto_increase_pct === undefined
                  ? ""
                  : String(initialItem.price_auto_increase_pct)
              }
            />
            <Input
              name="priceAutoIncreaseMonths"
              label="Auto Increase Months"
              type="number"
              step="1"
              defaultValue={
                initialItem?.price_auto_increase_months === null ||
                initialItem?.price_auto_increase_months === undefined
                  ? ""
                  : String(initialItem.price_auto_increase_months)
              }
            />
          </section>

          <section className="space-y-3 rounded-lg border border-[var(--divider)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Specs</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <Input
                name="lengthIn"
                label="Length (in)"
                type="number"
                step="0.01"
                defaultValue={
                  initialItem?.spec?.length_in === null || initialItem?.spec?.length_in === undefined
                    ? ""
                    : String(initialItem.spec.length_in)
                }
              />
              <Input
                name="widthIn"
                label="Width (in)"
                type="number"
                step="0.01"
                defaultValue={
                  initialItem?.spec?.width_in === null || initialItem?.spec?.width_in === undefined
                    ? ""
                    : String(initialItem.spec.width_in)
                }
              />
              <Input
                name="heightDepthIn"
                label="Height/Depth (in)"
                type="number"
                step="0.01"
                defaultValue={
                  initialItem?.spec?.height_depth_in === null ||
                  initialItem?.spec?.height_depth_in === undefined
                    ? ""
                    : String(initialItem.spec.height_depth_in)
                }
              />
              <Input
                name="spreadRateSqftPerInch"
                label="Spread Rate (sqft/in)"
                type="number"
                step="0.01"
                defaultValue={
                  initialItem?.spec?.spread_rate_sqft_per_inch === null ||
                  initialItem?.spec?.spread_rate_sqft_per_inch === undefined
                    ? ""
                    : String(initialItem.spec.spread_rate_sqft_per_inch)
                }
              />
              <Input
                name="faceFeet"
                label="Face Feet"
                type="number"
                step="0.01"
                defaultValue={
                  initialItem?.spec?.face_feet === null || initialItem?.spec?.face_feet === undefined
                    ? ""
                    : String(initialItem.spec.face_feet)
                }
              />
            </div>

            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                Extra Specs
              </p>
              {extraSpecs.map((entry, index) => (
                <div key={"extra-spec-" + String(index)} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <Input
                    label={index === 0 ? "Key" : undefined}
                    value={entry.key}
                    onChange={(event) =>
                      updateExtraSpec(index, { key: event.target.value })
                    }
                  />
                  <Input
                    label={index === 0 ? "Value" : undefined}
                    value={entry.value}
                    onChange={(event) =>
                      updateExtraSpec(index, { value: event.target.value })
                    }
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="text"
                      onClick={() => removeExtraSpec(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="secondary" onClick={addExtraSpec}>
                Add Spec
              </Button>
            </div>
          </section>

          <section className="space-y-3 rounded-lg border border-[var(--divider)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
              Supplier Links
            </h3>
            {supplierLinks.map((entry, index) => (
              <div
                key={"supplier-link-" + String(index)}
                className="space-y-2 rounded-lg border border-[var(--divider)] p-3"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                    Supplier
                    <select
                      value={entry.supplierId}
                      onChange={(event) =>
                        updateSupplierLink(index, { supplierId: event.target.value })
                      }
                      className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                    >
                      <option value="">Select supplier</option>
                      {supplierOptions.map((supplier) => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Supplier SKU"
                    value={entry.supplierSku}
                    onChange={(event) =>
                      updateSupplierLink(index, { supplierSku: event.target.value })
                    }
                  />
                  <Input
                    label="Supplier Item Name"
                    value={entry.supplierItemName}
                    onChange={(event) =>
                      updateSupplierLink(index, {
                        supplierItemName: event.target.value,
                      })
                    }
                  />
                  <Input
                    label="Unit Cost"
                    type="number"
                    step="0.01"
                    value={entry.unitCost}
                    onChange={(event) =>
                      updateSupplierLink(index, { unitCost: event.target.value })
                    }
                  />
                  <Input
                    label="Last Price Date"
                    type="date"
                    value={entry.lastPriceDate}
                    onChange={(event) =>
                      updateSupplierLink(index, { lastPriceDate: event.target.value })
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
                    <input
                      type="checkbox"
                      checked={entry.isPreferred}
                      onChange={(event) =>
                        updateSupplierLink(index, {
                          isPreferred: event.target.checked,
                        })
                      }
                    />
                    Preferred Supplier
                  </label>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => removeSupplierLink(index)}
                  >
                    Remove Supplier
                  </Button>
                </div>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addSupplierLink}>
              Add Supplier Link
            </Button>
            <p className="text-xs text-[var(--text-secondary)]">
              Only one supplier can be marked preferred. Selecting a new preferred
              supplier clears the previous one.
            </p>
          </section>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialItem?.is_active ?? true}
            />
            Item is active
          </label>

          {state.error ? <p className="auth-feedback-error">{state.error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={pending}>
              {submitLabel}
            </Button>
            <Link
              href={cancelHref}
              className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg border border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
