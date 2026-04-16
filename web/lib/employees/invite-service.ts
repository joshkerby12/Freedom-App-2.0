import { createClient } from "@/lib/supabase/server";

export type InviteLookupRecord = {
  id: string;
  orgId: string;
  orgName: string;
  employeeId: string;
  email: string;
  token: string;
  status: "pending" | "accepted" | "expired" | "revoked";
  invitedAt: string | null;
  acceptedAt: string | null;
  expiresAt: string;
};

function readOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readRequiredString(value: unknown, fallback = ""): string {
  return readOptionalString(value) ?? fallback;
}

function toInviteStatus(value: unknown): InviteLookupRecord["status"] {
  const status = readRequiredString(value, "pending");

  if (
    status === "pending" ||
    status === "accepted" ||
    status === "expired" ||
    status === "revoked"
  ) {
    return status;
  }

  return "pending";
}

async function assertNoError(error: { message: string } | null, context: string): Promise<void> {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function mapInvite(
  row: Record<string, unknown>,
  orgName: string,
): InviteLookupRecord {
  return {
    id: String(row.id),
    orgId: readRequiredString(row.org_id),
    orgName,
    employeeId: readRequiredString(row.employee_id),
    email: readRequiredString(row.email),
    token: readRequiredString(row.token),
    status: toInviteStatus(row.status),
    invitedAt: readOptionalString(row.invited_at),
    acceptedAt: readOptionalString(row.accepted_at),
    expiresAt: readRequiredString(row.expires_at),
  };
}

export async function sendInvite(
  orgId: string,
  employeeId: string,
  email: string,
  invitedByEmployeeId: string | null,
): Promise<string> {
  const supabase = await createClient();
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { data: createdInvite, error: createError } = await supabase
    .from("employee_invites")
    .insert({
      org_id: orgId,
      employee_id: employeeId,
      email: email.trim(),
      token,
      status: "pending",
      invited_by: invitedByEmployeeId,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  await assertNoError(createError, "Failed to create invite");

  const [{ data: orgRow }, { data: sessionData }] = await Promise.all([
    supabase.from("organizations").select("name").eq("id", orgId).limit(1).maybeSingle(),
    supabase.auth.getSession(),
  ]);

  const accessToken = sessionData.session?.access_token;

  if (accessToken) {
    const invokeResult = await supabase.functions.invoke("send-employee-invite", {
      body: {
        employee_id: employeeId,
        email: email.trim(),
        token,
        org_name: readRequiredString(orgRow?.name, "Ground Control Pro"),
      },
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (invokeResult.error) {
      throw new Error(`Failed to trigger invite email: ${invokeResult.error.message}`);
    }
  }

  return String(createdInvite.id);
}

export async function revokeInvite(orgId: string, inviteId: string): Promise<void> {
  const supabase = await createClient();

  const { error } = await supabase
    .from("employee_invites")
    .update({ status: "revoked" })
    .eq("org_id", orgId)
    .eq("id", inviteId);

  await assertNoError(error, "Failed to revoke invite");
}

export async function getInviteByToken(token: string): Promise<InviteLookupRecord | null> {
  const supabase = await createClient();

  const { data: inviteRow, error: inviteError } = await supabase
    .from("employee_invites")
    .select("id,org_id,employee_id,email,token,status,invited_at,accepted_at,expires_at")
    .eq("token", token)
    .limit(1)
    .maybeSingle();

  await assertNoError(inviteError, "Failed to load invite");

  if (!inviteRow) {
    return null;
  }

  let orgName = "Ground Control Pro";
  const { data: orgRow, error: orgError } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", inviteRow.org_id)
    .limit(1)
    .maybeSingle();

  if (!orgError && orgRow?.name) {
    orgName = String(orgRow.name);
  }

  return mapInvite(inviteRow as Record<string, unknown>, orgName);
}

export async function acceptInvite(
  token: string,
  password: string,
): Promise<void> {
  const invite = await getInviteByToken(token);

  if (!invite) {
    throw new Error("This invite link is expired or invalid.");
  }

  const expiry = Date.parse(invite.expiresAt);
  const isExpired = Number.isNaN(expiry) || expiry < Date.now();

  if (invite.status !== "pending" || isExpired) {
    throw new Error("This invite link is expired or invalid.");
  }

  const supabase = await createClient();

  const signUpResult = await supabase.auth.signUp({
    email: invite.email,
    password,
    options: {
      data: {
        full_name: invite.email.split("@")[0] ?? "",
      },
    },
  });

  if (signUpResult.error) {
    throw new Error(`Unable to create account: ${signUpResult.error.message}`);
  }

  const userId = signUpResult.data.user?.id ?? null;
  if (!userId) {
    throw new Error("Unable to create account for this invite.");
  }

  const updates = await Promise.all([
    supabase
      .from("employees")
      .update({ supabase_auth_uid: userId })
      .eq("org_id", invite.orgId)
      .eq("id", invite.employeeId),
    supabase
      .from("employee_invites")
      .update({
        status: "accepted",
        accepted_at: new Date().toISOString(),
      })
      .eq("org_id", invite.orgId)
      .eq("id", invite.id),
  ]);

  await Promise.all([
    assertNoError(updates[0].error, "Failed to link employee account"),
    assertNoError(updates[1].error, "Failed to mark invite accepted"),
  ]);

  const { data: membership, error: membershipLookupError } = await supabase
    .from("org_members")
    .select("id")
    .eq("org_id", invite.orgId)
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();

  await assertNoError(membershipLookupError, "Failed to verify org membership");

  if (!membership) {
    const { error: membershipInsertError } = await supabase.from("org_members").insert({
      org_id: invite.orgId,
      profile_id: userId,
      role: "member",
    });

    await assertNoError(membershipInsertError, "Failed to add org membership");
  }
}
