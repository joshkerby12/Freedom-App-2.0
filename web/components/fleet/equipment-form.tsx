import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EQUIPMENT_TYPES, type EquipmentType } from "@/lib/fleet/types";

export type EquipmentFormValues = {
  name?: string | null;
  type?: EquipmentType;
  make?: string | null;
  model?: string | null;
  year?: number | null;
  vin_serial?: string | null;
  license_plate?: string | null;
  dot_number?: string | null;
  registration_expiry?: string | null;
  insurance_expiry?: string | null;
  annual_inspection_due?: string | null;
  is_shareable?: boolean;
  is_active?: boolean;
  notes?: string | null;
};

type EquipmentFormProps = {
  title: string;
  subtitle?: string;
  submitLabel: string;
  action: (formData: FormData) => void | Promise<void>;
  cancelHref: string;
  defaultValues?: EquipmentFormValues;
};

function valueOrEmpty(value: string | number | null | undefined): string {
  return value == null ? "" : String(value);
}

export function EquipmentForm({
  title,
  subtitle,
  submitLabel,
  action,
  cancelHref,
  defaultValues,
}: EquipmentFormProps) {
  const defaults = defaultValues ?? {};

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle ? <p className="text-sm text-[var(--text-secondary)]">{subtitle}</p> : null}
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)] md:col-span-2">
              Name *
              <input
                required
                name="name"
                defaultValue={valueOrEmpty(defaults.name)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              Type *
              <select
                required
                name="type"
                defaultValue={defaults.type ?? "equipment"}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                {EQUIPMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type[0].toUpperCase() + type.slice(1)}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              Year
              <input
                name="year"
                type="number"
                min={1900}
                max={2100}
                defaultValue={valueOrEmpty(defaults.year)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              Make
              <input
                name="make"
                defaultValue={valueOrEmpty(defaults.make)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              Model
              <input
                name="model"
                defaultValue={valueOrEmpty(defaults.model)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              VIN / Serial
              <input
                name="vin_serial"
                defaultValue={valueOrEmpty(defaults.vin_serial)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              License Plate
              <input
                name="license_plate"
                defaultValue={valueOrEmpty(defaults.license_plate)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              DOT Number
              <input
                name="dot_number"
                defaultValue={valueOrEmpty(defaults.dot_number)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              Registration Expiry
              <input
                name="registration_expiry"
                type="date"
                defaultValue={valueOrEmpty(defaults.registration_expiry)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              Insurance Expiry
              <input
                name="insurance_expiry"
                type="date"
                defaultValue={valueOrEmpty(defaults.insurance_expiry)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)]">
              Annual Inspection Due
              <input
                name="annual_inspection_due"
                type="date"
                defaultValue={valueOrEmpty(defaults.annual_inspection_due)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]">
              <input
                name="is_shareable"
                type="checkbox"
                defaultChecked={defaults.is_shareable ?? false}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              Is shareable
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]">
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={defaults.is_active ?? true}
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              Is active
            </label>

            <label className="space-y-2 text-sm font-medium text-[var(--text-primary)] md:col-span-2">
              Notes
              <textarea
                name="notes"
                defaultValue={valueOrEmpty(defaults.notes)}
                rows={4}
                className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-body)]"
              />
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button type="submit">{submitLabel}</Button>
            <Link href={cancelHref}>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
