"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import type {
  ConfigurationFormActionState,
  EditableConfigurationRole,
} from "@/app/(app)/catalog/configurations/configuration-types";
import {
  getInitialConfigurationRoles,
  initialConfigurationFormActionState,
} from "@/app/(app)/catalog/configurations/configuration-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { CatalogLookupOption, MaterialConfigRecord, MaterialConfigType } from "@/lib/catalog/types";

type MaterialConfigFormAction = (
  previousState: ConfigurationFormActionState,
  formData: FormData,
) => Promise<ConfigurationFormActionState>;

type MaterialConfigFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: MaterialConfigFormAction;
  itemOptions: CatalogLookupOption[];
  initialConfig?: MaterialConfigRecord;
};

const configTypeOptions: Array<{ value: MaterialConfigType; label: string }> = [
  { value: "paver_patio", label: "Paver Patio" },
  { value: "wall", label: "Wall" },
  { value: "flagstone", label: "Flagstone" },
  { value: "mulch_bed", label: "Mulch Bed" },
  { value: "sod", label: "Sod" },
  { value: "rock_bed", label: "Rock Bed" },
  { value: "turf", label: "Turf" },
];

const requiredRolesByType: Record<MaterialConfigType, string[]> = {
  paver_patio: ["field", "border_soldier", "border_sailor"],
  wall: ["block", "cap"],
  flagstone: ["field", "border"],
  mulch_bed: ["mulch", "edging"],
  sod: ["sod", "soil_amendment"],
  rock_bed: ["rock", "edging"],
  turf: ["turf", "infill", "edging"],
};

function humanizeRole(roleKey: string): string {
  return roleKey
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function isFieldRole(roleKey: string): boolean {
  return roleKey.includes("field");
}

function isBorderRole(roleKey: string): boolean {
  return roleKey.includes("border");
}

export function MaterialConfigForm({
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  itemOptions,
  initialConfig,
}: MaterialConfigFormProps) {
  const initialType = initialConfig?.config_type ?? "paver_patio";
  const [state, formAction, pending] = useActionState(
    action,
    initialConfigurationFormActionState,
  );
  const [configType, setConfigType] = useState<MaterialConfigType>(initialType);
  const [roles, setRoles] = useState<EditableConfigurationRole[]>(
    getInitialConfigurationRoles(
      requiredRolesByType[initialType],
      initialConfig,
    ),
  );

  const selectedRoleColors = useMemo(() => {
    const colorSet = new Set<string>();

    for (const role of roles) {
      const matchedItem = itemOptions.find((item) => item.id === role.catalogItemId);
      if (matchedItem?.color) {
        colorSet.add(matchedItem.color);
      }
    }

    return Array.from(colorSet);
  }, [itemOptions, roles]);

  function handleTypeChange(nextType: MaterialConfigType) {
    setConfigType(nextType);

    const nextRoleKeys = requiredRolesByType[nextType] ?? [];
    setRoles((current) => {
      const roleMap = new Map(current.map((role) => [role.roleKey, role]));
      return nextRoleKeys.map((roleKey) => {
        const existing = roleMap.get(roleKey);
        return (
          existing ?? {
            roleKey,
            catalogItemId: "",
            areaPct: "",
            orientation: "",
          }
        );
      });
    });
  }

  function updateRole(index: number, patch: Partial<EditableConfigurationRole>) {
    setRoles((current) =>
      current.map((role, roleIndex) => {
        if (roleIndex !== index) {
          return role;
        }

        return {
          ...role,
          ...patch,
        };
      }),
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="rolesJson" value={JSON.stringify(roles)} />

          <section className="grid gap-4 md:grid-cols-2">
            <Input
              name="name"
              label="Configuration Name"
              required
              defaultValue={initialConfig?.name ?? ""}
            />
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Config Type
              <select
                name="configType"
                value={configType}
                onChange={(event) =>
                  handleTypeChange(event.target.value as MaterialConfigType)
                }
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                {configTypeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </section>

          <section className="space-y-3 rounded-lg border border-[var(--divider)] p-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Role Assignments</h3>
            {roles.map((role, index) => (
              <div
                key={role.roleKey}
                className="grid gap-3 rounded-lg border border-[var(--divider)] p-3 md:grid-cols-3"
              >
                <p className="text-sm font-semibold text-[var(--text-primary)] md:col-span-3">
                  {humanizeRole(role.roleKey)}
                </p>

                <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
                  Catalog Item
                  <select
                    value={role.catalogItemId}
                    onChange={(event) =>
                      updateRole(index, { catalogItemId: event.target.value })
                    }
                    className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                  >
                    <option value="">Select item</option>
                    {itemOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                        {item.subtitle ? ` (${item.subtitle})` : ""}
                      </option>
                    ))}
                  </select>
                </label>

                {isFieldRole(role.roleKey) ? (
                  <Input
                    label="Area %"
                    type="number"
                    step="0.01"
                    value={role.areaPct}
                    onChange={(event) =>
                      updateRole(index, { areaPct: event.target.value })
                    }
                  />
                ) : isBorderRole(role.roleKey) ? (
                  <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                    Orientation
                    <select
                      value={role.orientation}
                      onChange={(event) =>
                        updateRole(index, {
                          orientation: event.target.value as "soldier" | "sailor" | "",
                        })
                      }
                      className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                    >
                      <option value="">None</option>
                      <option value="soldier">Soldier</option>
                      <option value="sailor">Sailor</option>
                    </select>
                  </label>
                ) : (
                  <div />
                )}
              </div>
            ))}
          </section>

          <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3">
            <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Color Preview</p>
            {selectedRoleColors.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">Select catalog items to preview swatches.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {selectedRoleColors.map((color) => (
                  <span
                    key={color}
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--divider)] px-3 py-1 text-xs text-[var(--text-body)]"
                  >
                    <span
                      className="inline-block h-3 w-3 rounded-full border border-[var(--divider)]"
                      style={{ backgroundColor: color }}
                    />
                    {color}
                  </span>
                ))}
              </div>
            )}
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialConfig?.is_active ?? true}
            />
            Configuration is active
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
