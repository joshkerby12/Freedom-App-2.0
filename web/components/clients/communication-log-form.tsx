"use client";

import { useActionState } from "react";
import { logCommunicationAction } from "@/app/(app)/clients/actions";
import { initialCommunicationFormActionState } from "@/app/(app)/clients/client-types";
import { toLocalDatetimeInputValue } from "@/lib/clients/helpers";
import { Button } from "@/components/ui/button";

type CommunicationLogFormProps = {
  clientId: string;
};

export function CommunicationLogForm({ clientId }: CommunicationLogFormProps) {
  const [state, formAction, pending] = useActionState(
    logCommunicationAction,
    initialCommunicationFormActionState,
  );

  return (
    <form
      action={formAction}
      className="space-y-3 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-4"
      encType="multipart/form-data"
    >
      <input type="hidden" name="clientId" value={clientId} />

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
          Method
          <select
            name="method"
            defaultValue="phone"
            className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
          >
            <option value="phone">Phone</option>
            <option value="email">Email</option>
            <option value="text">Text</option>
            <option value="in_person">In Person</option>
            <option value="portal_message">Portal Message</option>
          </select>
        </label>

        <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
          Direction
          <select
            name="direction"
            defaultValue="outbound"
            className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
          >
            <option value="outbound">Outbound</option>
            <option value="inbound">Inbound</option>
          </select>
        </label>

        <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
          Result
          <select
            name="result"
            defaultValue=""
            className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
          >
            <option value="">Select result</option>
            <option value="spoke_with_client">Spoke with client</option>
            <option value="left_voicemail">Left voicemail</option>
            <option value="no_answer">No answer</option>
            <option value="email_sent">Email sent</option>
            <option value="meeting_held">Meeting held</option>
            <option value="other">Other</option>
          </select>
        </label>

        <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
          Occurred At
          <input
            type="datetime-local"
            name="occurredAt"
            defaultValue={toLocalDatetimeInputValue(null)}
            className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
            required
          />
        </label>
      </div>

      <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
        Notes
        <textarea
          name="notes"
          rows={3}
          className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm"
        />
      </label>

      <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
        Optional Attachment
        <input
          type="file"
          name="attachment"
          className="block w-full text-sm text-[var(--text-body)]"
        />
      </label>

      {state.error ? <p className="auth-feedback-error">{state.error}</p> : null}

      <Button type="submit" loading={pending}>
        Log Communication
      </Button>
    </form>
  );
}
