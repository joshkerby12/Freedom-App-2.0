"use client";

import { useActionState } from "react";
import { createOrgAction } from "./actions";
import { initialOrgSetupActionState } from "./onboarding-types";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  const [state, formAction, pending] = useActionState(
    createOrgAction,
    initialOrgSetupActionState,
  );

  return (
    <main className="flex min-h-screen items-center justify-center bg-[var(--surface)] px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            Set up your company
          </h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Create your organization to get started with Freedom App.
          </p>
        </div>

        <form action={formAction} className="space-y-4">
          <label className="block space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Company Name
            <input
              type="text"
              name="companyName"
              required
              maxLength={100}
              autoFocus
              placeholder="Freedom Landscapes"
              className="mt-1 h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-3 text-sm text-[var(--text-body)] placeholder:text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)]"
            />
          </label>

          {state.error ? (
            <p className="auth-feedback-error">{state.error}</p>
          ) : null}

          <Button type="submit" loading={pending} className="w-full">
            Create My Company
          </Button>
        </form>
      </div>
    </main>
  );
}
