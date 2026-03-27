import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export type CatalogOrgContext = {
  supabase: SupabaseClient;
  orgId: string;
  userId: string;
};

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export async function requireCatalogOrgContext(): Promise<CatalogOrgContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || user === null) {
    throw new Error("Unauthorized");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("profile_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    throw new Error(
      "Unable to resolve organization membership: " + membershipError.message,
    );
  }

  const orgId = asString(membership?.org_id);
  if (orgId === null) {
    throw new Error("No organization membership found");
  }

  return {
    supabase,
    orgId,
    userId: user.id,
  };
}
