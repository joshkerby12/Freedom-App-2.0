"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createPartner,
  deletePartner,
  updatePartner,
} from "@/lib/catalog/partner-service";
import type { PartnerInput } from "@/lib/catalog/types";
import type { PartnerFormActionState } from "@/app/(app)/catalog/partners/partner-types";

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

function parseError(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

function buildPartnerInput(formData: FormData): PartnerInput {
  return {
    companyName: readText(formData, "companyName"),
    contactName: readOptionalText(formData, "contactName"),
    phone: readOptionalText(formData, "phone"),
    email: readOptionalText(formData, "email"),
    tradeType: readOptionalText(formData, "tradeType"),
    notes: readOptionalText(formData, "notes"),
    isActive: readBoolean(formData, "isActive"),
  };
}

export async function createPartnerAction(
  _previousState: PartnerFormActionState,
  formData: FormData,
): Promise<PartnerFormActionState> {
  const payload = buildPartnerInput(formData);

  try {
    const partnerId = await createPartner(payload);
    revalidatePath("/catalog/partners");
    redirect(`/catalog/partners/${partnerId}`);
  } catch (error) {
    return {
      error: parseError(error, "Unable to create partner."),
    };
  }
}

export async function updatePartnerAction(
  partnerId: string,
  _previousState: PartnerFormActionState,
  formData: FormData,
): Promise<PartnerFormActionState> {
  const payload = buildPartnerInput(formData);

  try {
    await updatePartner(partnerId, payload);
    revalidatePath("/catalog/partners");
    revalidatePath(`/catalog/partners/${partnerId}`);
    revalidatePath(`/catalog/partners/${partnerId}/edit`);
    redirect(`/catalog/partners/${partnerId}?saved=updated`);
  } catch (error) {
    return {
      error: parseError(error, "Unable to update partner."),
    };
  }
}

export async function deletePartnerAction(partnerId: string): Promise<void> {
  try {
    await deletePartner(partnerId);
    revalidatePath("/catalog/partners");
  } catch (error) {
    const message = parseError(error, "Unable to delete partner.");
    redirect(`/catalog/partners/${partnerId}?error=${encodeURIComponent(message)}`);
  }

  redirect("/catalog/partners?saved=deleted");
}
