"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createConfig,
  deleteConfig,
  updateConfig,
} from "@/lib/catalog/material-config-service";
import type {
  MaterialConfigInput,
  MaterialConfigRoleInput,
  MaterialConfigType,
} from "@/lib/catalog/types";
import type { ConfigurationFormActionState } from "@/app/(app)/catalog/configurations/configuration-types";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true" || value === "1";
}

function parseOptionalNumber(value: unknown): number | null {
  if (typeof value !== "string" || value.trim().length === 0) {
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

function normalizeConfigType(value: string): MaterialConfigType {
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

  return "paver_patio";
}

function normalizeRoles(formData: FormData): MaterialConfigRoleInput[] {
  const rawRoles = readJsonArray<{
    roleKey: string;
    catalogItemId: string;
    areaPct?: string;
    orientation?: "soldier" | "sailor" | "";
  }>(formData, "rolesJson");

  return rawRoles.map((role, index) => ({
    roleKey: role.roleKey,
    catalogItemId: role.catalogItemId,
    areaPct: parseOptionalNumber(role.areaPct),
    orientation:
      role.orientation === "soldier" || role.orientation === "sailor"
        ? role.orientation
        : null,
    sortOrder: index,
  }));
}

function buildConfigInput(formData: FormData): MaterialConfigInput {
  return {
    name: readText(formData, "name"),
    configType: normalizeConfigType(readText(formData, "configType")),
    isActive: readBoolean(formData, "isActive"),
    roles: normalizeRoles(formData),
  };
}

function parseError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export async function createConfigurationAction(
  _previousState: ConfigurationFormActionState,
  formData: FormData,
): Promise<ConfigurationFormActionState> {
  const payload = buildConfigInput(formData);

  try {
    const configId = await createConfig(payload);
    revalidatePath("/catalog/configurations");
    revalidatePath("/catalog/products/new");
    redirect(`/catalog/configurations/${configId}/edit?saved=created`);
  } catch (error) {
    return {
      error: parseError(error, "Unable to create configuration."),
    };
  }
}

export async function updateConfigurationAction(
  configId: string,
  _previousState: ConfigurationFormActionState,
  formData: FormData,
): Promise<ConfigurationFormActionState> {
  const payload = buildConfigInput(formData);

  try {
    await updateConfig(configId, payload);
    revalidatePath("/catalog/configurations");
    revalidatePath(`/catalog/configurations/${configId}/edit`);
    revalidatePath("/catalog/products/new");
    redirect(`/catalog/configurations/${configId}/edit?saved=updated`);
  } catch (error) {
    return {
      error: parseError(error, "Unable to update configuration."),
    };
  }
}

export async function deleteConfigurationAction(configId: string): Promise<void> {
  try {
    await deleteConfig(configId);
    revalidatePath("/catalog/configurations");
    revalidatePath("/catalog/products/new");
  } catch (error) {
    const message = parseError(error, "Unable to delete configuration.");
    redirect(`/catalog/configurations/${configId}/edit?error=${encodeURIComponent(message)}`);
  }

  redirect("/catalog/configurations?saved=deleted");
}
