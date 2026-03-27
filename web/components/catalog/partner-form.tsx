"use client";

import Link from "next/link";
import { useActionState } from "react";
import type {
  PartnerFormActionState,
} from "@/app/(app)/catalog/partners/partner-types";
import {
  initialPartnerFormActionState,
} from "@/app/(app)/catalog/partners/partner-types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PartnerRecord } from "@/lib/catalog/types";

type PartnerFormAction = (
  previousState: PartnerFormActionState,
  formData: FormData,
) => Promise<PartnerFormActionState>;

type PartnerFormProps = {
  title: string;
  description: string;
  submitLabel: string;
  cancelHref: string;
  action: PartnerFormAction;
  initialPartner?: PartnerRecord;
};

export function PartnerForm({
  title,
  description,
  submitLabel,
  cancelHref,
  action,
  initialPartner,
}: PartnerFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialPartnerFormActionState,
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              name="companyName"
              label="Company Name"
              required
              defaultValue={initialPartner?.company_name ?? ""}
            />
            <Input
              name="contactName"
              label="Contact Name"
              defaultValue={initialPartner?.contact_name ?? ""}
            />
            <Input name="phone" label="Phone" defaultValue={initialPartner?.phone ?? ""} />
            <Input name="email" label="Email" defaultValue={initialPartner?.email ?? ""} />
            <Input
              name="tradeType"
              label="Trade Type"
              defaultValue={initialPartner?.trade_type ?? ""}
            />
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Notes
              <textarea
                name="notes"
                rows={4}
                defaultValue={initialPartner?.notes ?? ""}
                className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-body)]"
              />
            </label>
          </div>

          <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
            <input
              type="checkbox"
              name="isActive"
              defaultChecked={initialPartner?.is_active ?? true}
            />
            Partner is active
          </label>

          {state.error ? <p className="auth-feedback-error">{state.error}</p> : null}

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" loading={pending}>
              {submitLabel}
            </Button>
            <Link
              href={cancelHref}
              className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg border border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
            >
              Cancel
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
