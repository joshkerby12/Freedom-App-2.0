"use server";

import { redirect } from "next/navigation";
import { DASHBOARD_ROUTE } from "@/lib/routes";
import { createOrg } from "@/lib/orgs/org-service";
import type { OrgSetupActionState } from "./onboarding-types";

export async function createOrgAction(
  _previousState: OrgSetupActionState,
  formData: FormData,
): Promise<OrgSetupActionState> {
  const companyName = formData.get("companyName");
  const trimmed = typeof companyName === "string" ? companyName.trim() : "";

  if (!trimmed) {
    return { error: "Company name is required." };
  }

  if (trimmed.length > 100) {
    return { error: "Company name must be 100 characters or fewer." };
  }

  try {
    await createOrg(trimmed);
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Unable to create your organization right now.",
    };
  }

  // redirect() must be called outside try/catch — it throws a special internal
  // error that gets swallowed if caught, preventing the navigation from firing.
  redirect(DASHBOARD_ROUTE);
}
