import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EquipmentMaintenanceRecord } from "@/lib/fleet/types";

type MaintenanceLogSectionProps = {
  entries: EquipmentMaintenanceRecord[];
  action: (formData: FormData) => void | Promise<void>;
};

export function MaintenanceLogSection({ entries, action }: MaintenanceLogSectionProps) {
  return (
    <Card id="maintenance-log">
      <CardHeader>
        <CardTitle>Maintenance Log</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No maintenance records yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{entry.type}</p>
                  <p className="text-xs text-[var(--text-secondary)]">{entry.performed_date}</p>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {entry.performed_by ? `By ${entry.performed_by}` : "Performed by not specified"}
                  {entry.cost != null ? ` • $${entry.cost.toFixed(2)}` : ""}
                </p>
                {entry.notes ? <p className="mt-2 text-sm text-[var(--text-body)]">{entry.notes}</p> : null}
                {entry.receipt_url ? (
                  <a
                    href={entry.receipt_url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-[var(--brand-primary)]"
                  >
                    View receipt
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}

        <form action={action} className="space-y-4" encType="multipart/form-data">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">Log Maintenance</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Type *
              <input
                required
                name="type"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
                placeholder="Oil change"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Performed Date *
              <input
                required
                type="date"
                name="performed_date"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Mileage
              <input
                type="number"
                name="mileage"
                min={0}
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Next Service Date
              <input
                type="date"
                name="next_service_date"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Next Service Mileage
              <input
                type="number"
                name="next_service_mileage"
                min={0}
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Performed By
              <input
                name="performed_by"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Cost
              <input
                type="number"
                name="cost"
                min={0}
                step="0.01"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Notes
              <textarea
                rows={3}
                name="notes"
                className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Receipt (optional)
              <input
                type="file"
                name="receipt_file"
                className="block w-full text-sm text-[var(--text-body)]"
              />
            </label>
          </div>

          <Button type="submit">Save Maintenance</Button>
        </form>
      </CardContent>
    </Card>
  );
}
