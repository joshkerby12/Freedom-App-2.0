"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createCrew,
  type CrewUpsertInput,
  updateCrew,
} from "@/lib/crews/crew-service";
import { createClient } from "@/lib/supabase/server";
import type { CrewFormActionState } from "./crew-types";

function readTextField(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function readOptionalField(formData: FormData, key: string): string | null {
  const value = readTextField(formData, key);
  return value.length > 0 ? value : null;
}

function readCheckboxField(formData: FormData, key: string): boolean {
  const value = formData.get(key);
  return value === "on" || value === "true";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function parseCrewInput(formData: FormData): {
  input: CrewUpsertInput | null;
  error: string | null;
} {
  const name = readTextField(formData, "name");
  const crewLeadId = readOptionalField(formData, "crewLeadId");
  const notes = readOptionalField(formData, "notes");
  const isActive = readCheckboxField(formData, "isActive");

  if (!name) {
    return {
      input: null,
      error: "Crew name is required.",
    };
  }

  return {
    input: {
      name,
      crewLeadId,
      notes,
      isActive,
    },
    error: null,
  };
}

export async function createCrewAction(
  _previousState: CrewFormActionState,
  formData: FormData,
): Promise<CrewFormActionState> {
  const { input, error } = parseCrewInput(formData);
  if (!input) {
    return { error };
  }

  try {
    const supabase = await createClient();
    const crewId = await createCrew(supabase, input);

    revalidatePath("/crews");
    revalidatePath(`/crews/${crewId}`);
    redirect(`/crews/${crewId}`);
  } catch (actionError) {
    return {
      error: getErrorMessage(actionError, "Unable to create crew right now."),
    };
  }
}

export async function updateCrewAction(
  crewId: string,
  _previousState: CrewFormActionState,
  formData: FormData,
): Promise<CrewFormActionState> {
  const { input, error } = parseCrewInput(formData);
  if (!input) {
    return { error };
  }

  try {
    const supabase = await createClient();
    await updateCrew(supabase, crewId, input);

    revalidatePath("/crews");
    revalidatePath(`/crews/${crewId}`);
    redirect(`/crews/${crewId}`);
  } catch (actionError) {
    return {
      error: getErrorMessage(actionError, "Unable to update crew right now."),
    };
  }
}
