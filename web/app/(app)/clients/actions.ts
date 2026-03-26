"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createCommunication, saveClient } from "@/lib/clients/service";
import type {
  ClientAddressInput,
  ClientContactInput,
  CreateCommunicationInput,
  SaveClientInput,
} from "@/lib/clients/types";

import type { ClientFormActionState, CommunicationFormActionState } from "./client-types";

function readText(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readBoolean(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  if (typeof value !== "string") {
    return false;
  }

  return value === "true" || value === "on";
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

function normalizeContactFrequency(value: string): SaveClientInput["contactFrequency"] {
  if (
    value === "monthly" ||
    value === "quarterly" ||
    value === "bi-annually" ||
    value === "annually" ||
    value === "custom"
  ) {
    return value;
  }

  return undefined;
}

function normalizeCommunicationMethod(
  value: string,
): CreateCommunicationInput["method"] {
  if (
    value === "phone" ||
    value === "email" ||
    value === "text" ||
    value === "in_person" ||
    value === "portal_message"
  ) {
    return value;
  }

  return "phone";
}

function normalizeCommunicationDirection(
  value: string,
): CreateCommunicationInput["direction"] {
  return value === "inbound" ? "inbound" : "outbound";
}

function normalizeCommunicationResult(
  value: string,
): CreateCommunicationInput["result"] {
  if (
    value === "spoke_with_client" ||
    value === "left_voicemail" ||
    value === "no_answer" ||
    value === "email_sent" ||
    value === "meeting_held" ||
    value === "other"
  ) {
    return value;
  }

  return undefined;
}

export async function saveClientAction(
  _previousState: ClientFormActionState,
  formData: FormData,
): Promise<ClientFormActionState> {
  const clientId = readText(formData, "clientId") || undefined;
  const contactFrequency = normalizeContactFrequency(readText(formData, "contactFrequency"));
  const contactFrequencyDaysRaw = readText(formData, "contactFrequencyDays");

  const payload: SaveClientInput = {
    id: clientId,
    isCompany: readText(formData, "isCompany") === "true",
    companyName: readText(formData, "companyName") || undefined,
    firstName: readText(formData, "firstName"),
    lastName: readText(formData, "lastName"),
    displayName: readText(formData, "displayName") || undefined,
    phone: readText(formData, "phone") || undefined,
    email: readText(formData, "email") || undefined,
    clientTypeId: readText(formData, "clientTypeId") || undefined,
    salesLead: readText(formData, "salesLead") || undefined,
    referralFunnelId: readText(formData, "referralFunnelId") || undefined,
    referralSourceId: readText(formData, "referralSourceId") || undefined,
    paymentTermsId: readText(formData, "paymentTermsId") || undefined,
    contactFrequency,
    contactFrequencyDays: contactFrequencyDaysRaw
      ? Number.parseInt(contactFrequencyDaysRaw, 10)
      : undefined,
    isPreviousCustomer: readBoolean(formData, "isPreviousCustomer"),
    hasPortalAccess: readBoolean(formData, "hasPortalAccess"),
    notes: readText(formData, "notes") || undefined,
    addresses: readJsonArray<ClientAddressInput>(formData, "addressesJson"),
    contacts: readJsonArray<ClientContactInput>(formData, "contactsJson"),
    tagIds: readJsonArray<string>(formData, "tagIdsJson"),
  };

  try {
    const savedClientId = await saveClient(payload);
    revalidatePath("/clients");
    revalidatePath(`/clients/${savedClientId}`);
    revalidatePath(`/clients/${savedClientId}/edit`);
    redirect(`/clients/${savedClientId}`);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to save client.",
    };
  }
}

export async function logCommunicationAction(
  _previousState: CommunicationFormActionState,
  formData: FormData,
): Promise<CommunicationFormActionState> {
  const clientId = readText(formData, "clientId");
  if (!clientId) {
    return { error: "Missing client id." };
  }

  const attachmentValue = formData.get("attachment");
  const attachment =
    attachmentValue instanceof File && attachmentValue.size > 0
      ? attachmentValue
      : undefined;

  const payload: CreateCommunicationInput = {
    clientId,
    method: normalizeCommunicationMethod(readText(formData, "method")),
    direction: normalizeCommunicationDirection(readText(formData, "direction")),
    result: normalizeCommunicationResult(readText(formData, "result")),
    notes: readText(formData, "notes") || undefined,
    occurredAt: readText(formData, "occurredAt"),
    attachment,
  };

  try {
    await createCommunication(payload);
    revalidatePath("/clients");
    revalidatePath(`/clients/${clientId}`);
    redirect(`/clients/${clientId}`);
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Unable to log communication right now.",
    };
  }
}
