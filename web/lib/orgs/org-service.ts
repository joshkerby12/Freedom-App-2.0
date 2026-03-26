import { createClient } from "@/lib/supabase/server";

export async function createOrg(companyName: string): Promise<void> {
  const supabase = await createClient();
  const trimmedName = companyName.trim();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("You must be signed in to create an organization.");
  }

  // Use a SECURITY DEFINER RPC to bypass the self-referential org_members
  // SELECT policy, which causes infinite recursion when no membership exists yet.
  const { data: orgId, error: rpcError } = await supabase.rpc("create_org", {
    org_name: trimmedName,
  });

  if (rpcError || !orgId) {
    throw new Error("Unable to create your organization. Please try again.");
  }

  // Fire-and-forget — seed failure does not block onboarding
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (accessToken) {
      await supabase.functions.invoke("seed-org-data", {
        body: { org_id: orgId },
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }
  } catch {
    // Seed failure is non-fatal — can be re-triggered manually
  }
}
