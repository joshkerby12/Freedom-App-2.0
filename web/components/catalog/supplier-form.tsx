"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type {
  EditableSupplierLocation,
  SupplierFormActionState,
} from "@/app/(app)/catalog/suppliers/supplier-types";
import {
  emptySupplierLocation,
  getInitialSupplierLocations,
  initialSupplierFormActionState,
} from "@/app/(app)/catalog/suppliers/supplier-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { SupplierDetail } from "@/lib/catalog/types";

type SupplierFormAction = (
  previousState: SupplierFormActionState,
  formData: FormData,
) => Promise<SupplierFormActionState>;

type SupplierFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: SupplierFormAction;
  initialSupplier?: SupplierDetail;
};

export function SupplierForm({
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  initialSupplier,
}: SupplierFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialSupplierFormActionState,
  );
  const [locations, setLocations] = useState<EditableSupplierLocation[]>(
    getInitialSupplierLocations(initialSupplier),
  );

  function updateLocation(index: number, patch: Partial<EditableSupplierLocation>) {
    setLocations((current) =>
      current.map((location, locationIndex) => {
        if (locationIndex !== index) {
          if (patch.isPrimary === true) {
            return { ...location, isPrimary: false };
          }

          return location;
        }

        return {
          ...location,
          ...patch,
        };
      }),
    );
  }

  function addLocation() {
    setLocations((current) => [...current, emptySupplierLocation()]);
  }

  function removeLocation(index: number) {
    setLocations((current) => {
      const filtered = current.filter((_, currentIndex) => currentIndex !== index);
      return filtered.length > 0 ? filtered : [{ ...emptySupplierLocation(), isPrimary: true }];
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
          <input type="hidden" name="locationsJson" value={JSON.stringify(locations)} />

          <section className="grid gap-4 md:grid-cols-2">
            <Input
              name="name"
              label="Supplier Name"
              required
              defaultValue={initialSupplier?.name ?? ""}
            />
            <Input
              name="contactName"
              label="Contact Name"
              defaultValue={initialSupplier?.contact_name ?? ""}
            />
            <Input name="phone" label="Phone" defaultValue={initialSupplier?.phone ?? ""} />
            <Input name="email" label="Email" defaultValue={initialSupplier?.email ?? ""} />
            <Input
              name="website"
              label="Website"
              defaultValue={initialSupplier?.website ?? ""}
            />
          </section>

          <section className="space-y-3 rounded-lg border border-[var(--divider)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Locations</h3>
              <Button type="button" variant="secondary" onClick={addLocation}>
                Add Location
              </Button>
            </div>

            {locations.map((location, index) => (
              <div
                key={`location-${index}`}
                className="space-y-3 rounded-lg border border-[var(--divider)] p-3"
              >
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Location Name"
                    value={location.name}
                    onChange={(event) =>
                      updateLocation(index, { name: event.target.value })
                    }
                  />
                  <Input
                    label="Street Address"
                    value={location.streetAddress}
                    onChange={(event) =>
                      updateLocation(index, {
                        streetAddress: event.target.value,
                      })
                    }
                  />
                  <Input
                    label="City"
                    value={location.city}
                    onChange={(event) =>
                      updateLocation(index, { city: event.target.value })
                    }
                  />
                  <Input
                    label="State"
                    value={location.state}
                    onChange={(event) =>
                      updateLocation(index, { state: event.target.value })
                    }
                  />
                  <Input
                    label="Zip"
                    value={location.zip}
                    onChange={(event) =>
                      updateLocation(index, { zip: event.target.value })
                    }
                  />
                  <Input
                    label="Phone"
                    value={location.phone}
                    onChange={(event) =>
                      updateLocation(index, { phone: event.target.value })
                    }
                  />
                  <Input
                    label="Latitude"
                    type="number"
                    step="0.000001"
                    value={location.lat}
                    onChange={(event) =>
                      updateLocation(index, { lat: event.target.value })
                    }
                  />
                  <Input
                    label="Longitude"
                    type="number"
                    step="0.000001"
                    value={location.lng}
                    onChange={(event) =>
                      updateLocation(index, { lng: event.target.value })
                    }
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
                    <input
                      type="checkbox"
                      checked={location.isPrimary}
                      onChange={(event) =>
                        updateLocation(index, { isPrimary: event.target.checked })
                      }
                    />
                    Primary
                  </label>
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
                    <input
                      type="checkbox"
                      checked={location.isActive}
                      onChange={(event) =>
                        updateLocation(index, { isActive: event.target.checked })
                      }
                    />
                    Active
                  </label>
                  <Button type="button" variant="text" onClick={() => removeLocation(index)}>
                    Remove Location
                  </Button>
                </div>
              </div>
            ))}
          </section>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialSupplier?.is_active ?? true}
            />
            Supplier is active
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
