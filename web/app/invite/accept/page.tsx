import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getInviteByToken } from "@/lib/employees/invite-service";
import { acceptInviteAction } from "./actions";

type ParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

function readParam(params: Record<string, string | string[] | undefined>, key: string): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function isInviteValid(status: string, expiresAt: string): boolean {
  if (status !== "pending") {
    return false;
  }

  const expiry = Date.parse(expiresAt);
  if (Number.isNaN(expiry)) {
    return false;
  }

  return expiry >= Date.now();
}

export default async function InviteAcceptPage({ searchParams }: { searchParams: ParamsInput }) {
  const params = await Promise.resolve(searchParams);
  const token = readParam(params, "token");
  const errorMessage = readParam(params, "error");

  const invite = token ? await getInviteByToken(token) : null;
  const validInvite = invite && isInviteValid(invite.status, invite.expiresAt) ? invite : null;

  return (
    <main className="auth-page">
      <div className="auth-panel">
        <Card className="w-full max-w-md p-6">
          <CardHeader className="mb-2 px-0">
            <CardTitle>Accept Invite</CardTitle>
            {validInvite ? (
              <CardDescription>Welcome to {validInvite.orgName}</CardDescription>
            ) : (
              <CardDescription>This invite link is expired or invalid.</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-4 px-0">
            {errorMessage ? <p className="auth-feedback-error">{errorMessage}</p> : null}

            {validInvite ? (
              <form action={acceptInviteAction} className="space-y-4">
                <Input label="Email" value={validInvite.email} readOnly />
                <Input
                  name="password"
                  label="Password"
                  type="password"
                  required
                  autoComplete="new-password"
                />
                <Input
                  name="confirmPassword"
                  label="Confirm Password"
                  type="password"
                  required
                  autoComplete="new-password"
                />
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="returnPath" value={`/invite/accept?token=${encodeURIComponent(token)}`} />
                <button
                  type="submit"
                  className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
                >
                  Accept Invite
                </button>
              </form>
            ) : (
              <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
                This invite link is expired or invalid.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
