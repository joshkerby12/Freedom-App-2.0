"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type {
  EditableProductComponent,
  EditableProductInput,
  ProductFormActionState,
} from "@/app/(app)/catalog/products/product-types";
import {
  emptyEditableProductComponent,
  emptyEditableProductInput,
  getInitialEditableComponents,
  getInitialEditableInputs,
  initialProductFormActionState,
} from "@/app/(app)/catalog/products/product-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type {
  MaterialConfigType,
  ProductCatalogDetail,
  ProductCategory,
  ProductComponentType,
  ProductInputType,
  ProductPricingMode,
} from "@/lib/catalog/types";

const categoryOptions: Array<{ value: ProductCategory; label: string }> = [
  { value: "hardscape", label: "Hardscape" },
  { value: "softscape", label: "Softscape" },
  { value: "drainage", label: "Drainage" },
  { value: "irrigation", label: "Irrigation" },
  { value: "maintenance", label: "Maintenance" },
  { value: "snow", label: "Snow" },
  { value: "other", label: "Other" },
];

const pricingModeOptions: Array<{ value: ProductPricingMode; label: string }> = [
  { value: "cost_plus", label: "Cost Plus" },
  { value: "flat_rate", label: "Flat Rate" },
  { value: "per_sf", label: "Per SF" },
  { value: "t_and_m", label: "Time and Materials" },
];

const inputTypeOptions: Array<{ value: ProductInputType; label: string }> = [
  { value: "number", label: "Number" },
  { value: "item_dropdown", label: "Item Dropdown" },
  { value: "color_dropdown", label: "Color Dropdown" },
  { value: "config_dropdown", label: "Configuration Dropdown" },
  { value: "custom_dropdown", label: "Custom Dropdown" },
  { value: "text", label: "Text" },
];

const componentTypeOptions: Array<{ value: ProductComponentType; label: string }> = [
  { value: "catalog_item", label: "Catalog Item" },
  { value: "material_configuration", label: "Material Configuration" },
  { value: "labor", label: "Labor" },
  { value: "equipment", label: "Equipment" },
  { value: "partner", label: "Partner" },
];

const configTypeOptions: Array<{ value: MaterialConfigType; label: string }> = [
  { value: "paver_patio", label: "Paver Patio" },
  { value: "wall", label: "Wall" },
  { value: "flagstone", label: "Flagstone" },
  { value: "mulch_bed", label: "Mulch Bed" },
  { value: "sod", label: "Sod" },
  { value: "rock_bed", label: "Rock Bed" },
  { value: "turf", label: "Turf" },
];

type ProductFormAction = (
  previousState: ProductFormActionState,
  formData: FormData,
) => Promise<ProductFormActionState>;

type ProductFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: ProductFormAction;
  lookupOptions: {
    items: Array<{ id: string; label: string; subtitle?: string | null }>;
    configurations: Array<{ id: string; label: string; subtitle?: string | null }>;
  };
  initialProduct?: ProductCatalogDetail;
};

function moveItem<T>(items: T[], index: number, direction: "up" | "down"): T[] {
  const nextIndex = direction === "up" ? index - 1 : index + 1;
  if (nextIndex < 0 || nextIndex >= items.length) {
    return items;
  }

  const cloned = [...items];
  const [target] = cloned.splice(index, 1);
  cloned.splice(nextIndex, 0, target);
  return cloned;
}

export function ProductForm({
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  lookupOptions,
  initialProduct,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialProductFormActionState,
  );
  const [pricingMode, setPricingMode] = useState<ProductPricingMode>(
    initialProduct?.pricing_mode ?? "cost_plus",
  );
  const [inputs, setInputs] = useState<EditableProductInput[]>(
    getInitialEditableInputs(initialProduct),
  );
  const [components, setComponents] = useState<EditableProductComponent[]>(
    getInitialEditableComponents(initialProduct),
  );

  const inputReferenceOptions = useMemo(
    () =>
      inputs
        .map((entry) => entry.label.trim())
        .filter((entry) => entry.length > 0),
    [inputs],
  );

  function updateInput(index: number, patch: Partial<EditableProductInput>) {
    setInputs((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== index) {
          return entry;
        }

        return {
          ...entry,
          ...patch,
        };
      }),
    );
  }

  function addInput() {
    setInputs((current) => [...current, emptyEditableProductInput()]);
  }

  function removeInput(index: number) {
    setInputs((current) => {
      const filtered = current.filter((_, entryIndex) => entryIndex !== index);
      return filtered.length > 0 ? filtered : [emptyEditableProductInput()];
    });
  }

  function moveInput(index: number, direction: "up" | "down") {
    setInputs((current) => moveItem(current, index, direction));
  }

  function updateCustomOption(inputIndex: number, optionIndex: number, value: string) {
    setInputs((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== inputIndex) {
          return entry;
        }

        const nextOptions = entry.customOptions.map((option, currentOptionIndex) => {
          return currentOptionIndex === optionIndex ? value : option;
        });

        return {
          ...entry,
          customOptions: nextOptions,
        };
      }),
    );
  }

  function addCustomOption(inputIndex: number) {
    setInputs((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== inputIndex) {
          return entry;
        }

        return {
          ...entry,
          customOptions: [...entry.customOptions, ""],
        };
      }),
    );
  }

  function removeCustomOption(inputIndex: number, optionIndex: number) {
    setInputs((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== inputIndex) {
          return entry;
        }

        const nextOptions = entry.customOptions.filter(
          (_, currentOptionIndex) => currentOptionIndex !== optionIndex,
        );

        return {
          ...entry,
          customOptions: nextOptions.length > 0 ? nextOptions : [""],
        };
      }),
    );
  }

  function updateComponent(index: number, patch: Partial<EditableProductComponent>) {
    setComponents((current) =>
      current.map((entry, entryIndex) => {
        if (entryIndex !== index) {
          return entry;
        }

        return {
          ...entry,
          ...patch,
        };
      }),
    );
  }

  function addComponent() {
    setComponents((current) => [...current, emptyEditableProductComponent()]);
  }

  function removeComponent(index: number) {
    setComponents((current) => {
      const filtered = current.filter((_, entryIndex) => entryIndex !== index);
      return filtered.length > 0 ? filtered : [emptyEditableProductComponent()];
    });
  }

  function moveComponent(index: number, direction: "up" | "down") {
    setComponents((current) => moveItem(current, index, direction));
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="inputsJson" value={JSON.stringify(inputs)} />
          <input type="hidden" name="componentsJson" value={JSON.stringify(components)} />

          <section className="grid gap-4 md:grid-cols-2">
            <Input
              name="name"
              label="Product Name"
              required
              defaultValue={initialProduct?.name ?? ""}
            />
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Category
              <select
                name="category"
                defaultValue={initialProduct?.category ?? "hardscape"}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Pricing Mode
              <select
                name="pricingMode"
                value={pricingMode}
                onChange={(event) =>
                  setPricingMode(event.target.value as ProductPricingMode)
                }
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                {pricingModeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <Input
              name="installRate"
              label="Install Rate (hours/unit)"
              type="number"
              step="0.01"
              defaultValue={
                initialProduct?.install_rate === null || initialProduct?.install_rate === undefined
                  ? ""
                  : String(initialProduct.install_rate)
              }
            />

            <Input
              name="minimumHours"
              label="Minimum Hours"
              type="number"
              step="0.01"
              defaultValue={
                initialProduct?.minimum_hours === null || initialProduct?.minimum_hours === undefined
                  ? ""
                  : String(initialProduct.minimum_hours)
              }
            />

            {pricingMode === "flat_rate" ? (
              <Input
                name="flatRatePrice"
                label="Flat Rate Price"
                type="number"
                step="0.01"
                defaultValue={
                  initialProduct?.flat_rate_price === null ||
                  initialProduct?.flat_rate_price === undefined
                    ? ""
                    : String(initialProduct.flat_rate_price)
                }
              />
            ) : null}

            <Input
              name="laborRateOverride"
              label="Labor Rate Override"
              type="number"
              step="0.01"
              defaultValue={
                initialProduct?.labor_rate_override === null ||
                initialProduct?.labor_rate_override === undefined
                  ? ""
                  : String(initialProduct.labor_rate_override)
              }
            />

            <Input
              name="equipmentRateOverride"
              label="Equipment Rate Override"
              type="number"
              step="0.01"
              defaultValue={
                initialProduct?.equipment_rate_override === null ||
                initialProduct?.equipment_rate_override === undefined
                  ? ""
                  : String(initialProduct.equipment_rate_override)
              }
            />

            <Input
              name="quickbooksItemCode"
              label="QB Item Code"
              defaultValue={initialProduct?.quickbooks_item_code ?? ""}
            />

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Default Description
              <textarea
                name="defaultDescription"
                rows={3}
                defaultValue={initialProduct?.default_description ?? ""}
                className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-body)]"
              />
            </label>
          </section>

          <section className="space-y-3 rounded-lg border border-[var(--divider)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Inputs Builder</h3>
              <Button type="button" variant="secondary" onClick={addInput}>
                Add Input
              </Button>
            </div>

            {inputs.map((input, inputIndex) => (
              <div
                key={`input-${inputIndex}`}
                className="space-y-3 rounded-lg border border-[var(--divider)] p-3"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    label="Label"
                    value={input.label}
                    onChange={(event) =>
                      updateInput(inputIndex, { label: event.target.value })
                    }
                  />
                  <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                    Input Type
                    <select
                      value={input.inputType}
                      onChange={(event) =>
                        updateInput(inputIndex, {
                          inputType: event.target.value as ProductInputType,
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                    >
                      {inputTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Unit Label"
                    value={input.unitLabel}
                    onChange={(event) =>
                      updateInput(inputIndex, { unitLabel: event.target.value })
                    }
                  />
                  <Input
                    label="Default Value"
                    value={input.defaultValue}
                    onChange={(event) =>
                      updateInput(inputIndex, {
                        defaultValue: event.target.value,
                      })
                    }
                  />

                  {input.inputType === "config_dropdown" ? (
                    <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                      Config Type Filter
                      <select
                        value={input.configTypeFilter}
                        onChange={(event) =>
                          updateInput(inputIndex, {
                            configTypeFilter:
                              event.target.value as MaterialConfigType | "",
                          })
                        }
                        className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                      >
                        <option value="">All types</option>
                        {configTypeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <div />
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
                    <input
                      type="checkbox"
                      checked={input.isRequired}
                      onChange={(event) =>
                        updateInput(inputIndex, { isRequired: event.target.checked })
                      }
                    />
                    Required
                  </label>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => moveInput(inputIndex, "up")}
                  >
                    Move Up
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => moveInput(inputIndex, "down")}
                  >
                    Move Down
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => removeInput(inputIndex)}
                  >
                    Remove
                  </Button>
                </div>

                {input.inputType === "custom_dropdown" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-[var(--text-secondary)]">
                      Custom Options
                    </p>
                    {input.customOptions.map((option, optionIndex) => (
                      <div
                        key={`custom-option-${inputIndex}-${optionIndex}`}
                        className="flex items-center gap-2"
                      >
                        <Input
                          value={option}
                          onChange={(event) =>
                            updateCustomOption(inputIndex, optionIndex, event.target.value)
                          }
                        />
                        <Button
                          type="button"
                          variant="text"
                          onClick={() => removeCustomOption(inputIndex, optionIndex)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => addCustomOption(inputIndex)}
                    >
                      Add Option
                    </Button>
                  </div>
                ) : null}
              </div>
            ))}
          </section>

          <section className="space-y-3 rounded-lg border border-[var(--divider)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Components Builder</h3>
              <Button type="button" variant="secondary" onClick={addComponent}>
                Add Component
              </Button>
            </div>

            {components.map((component, componentIndex) => (
              <div
                key={`component-${componentIndex}`}
                className="space-y-3 rounded-lg border border-[var(--divider)] p-3"
              >
                <div className="grid gap-3 md:grid-cols-3">
                  <Input
                    label="Label"
                    value={component.label}
                    onChange={(event) =>
                      updateComponent(componentIndex, { label: event.target.value })
                    }
                  />
                  <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                    Component Type
                    <select
                      value={component.componentType}
                      onChange={(event) =>
                        updateComponent(componentIndex, {
                          componentType: event.target.value as ProductComponentType,
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                    >
                      {componentTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <Input
                    label="Quantity Formula"
                    value={component.qtyFormula}
                    onChange={(event) =>
                      updateComponent(componentIndex, {
                        qtyFormula: event.target.value,
                      })
                    }
                  />

                  <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                    Fixed Catalog Item
                    <select
                      value={component.catalogItemId}
                      onChange={(event) =>
                        updateComponent(componentIndex, {
                          catalogItemId: event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                    >
                      <option value="">None</option>
                      {lookupOptions.items.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                          {item.subtitle ? ` (${item.subtitle})` : ""}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                    Input Ref
                    <select
                      value={component.inputRef}
                      onChange={(event) =>
                        updateComponent(componentIndex, {
                          inputRef: event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                    >
                      <option value="">None</option>
                      {inputReferenceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                    Configuration Input Ref
                    <select
                      value={component.configurationInputRef}
                      onChange={(event) =>
                        updateComponent(componentIndex, {
                          configurationInputRef: event.target.value,
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                    >
                      <option value="">None</option>
                      {inputReferenceOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => moveComponent(componentIndex, "up")}
                  >
                    Move Up
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => moveComponent(componentIndex, "down")}
                  >
                    Move Down
                  </Button>
                  <Button
                    type="button"
                    variant="text"
                    onClick={() => removeComponent(componentIndex)}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </section>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialProduct?.is_active ?? true}
            />
            Product is active
          </label>

          {initialProduct?.is_system_template ? (
            <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-3 py-2 text-xs text-[var(--text-secondary)]">
              This is a system template. It can be edited but not deleted.
            </p>
          ) : null}

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
