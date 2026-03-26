import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COMMON_DVIR_DEFECTS } from "@/lib/fleet/dvir-service";
import type { DvirDriverOption, VehicleInspectionRecord } from "@/lib/fleet/types";

type DvirSectionProps = {
  entries: VehicleInspectionRecord[];
  drivers: DvirDriverOption[];
  action: (formData: FormData) => void | Promise<void>;
};

export function DvirSection({ entries, drivers, action }: DvirSectionProps) {
  return (
    <Card id="dvir-history">
      <CardHeader>
        <CardTitle>DVIR History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {entries.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">No DVIR entries yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <article
                key={entry.id}
                className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {entry.inspection_type === "pre_trip" ? "Pre-Trip" : "Post-Trip"}
                  </p>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      entry.passed
                        ? "bg-[#e8f4ec] text-[#24683a]"
                        : "bg-[#ffe6e6] text-[var(--error)]"
                    }`}
                  >
                    {entry.passed ? "Passed" : "Failed"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {entry.inspection_date} • {entry.driver_name ?? "Unknown Driver"}
                  {entry.odometer != null ? ` • Odometer: ${entry.odometer}` : ""}
                </p>
                {!entry.passed && entry.defects?.length ? (
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    Defects: {entry.defects.join(", ")}
                  </p>
                ) : null}
                {entry.notes ? <p className="mt-2 text-sm text-[var(--text-body)]">{entry.notes}</p> : null}
                {entry.driver_signature ? (
                  <a
                    href={entry.driver_signature}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block text-xs font-semibold text-[var(--brand-primary)]"
                  >
                    View signature
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        )}

        <form action={action} className="space-y-4" encType="multipart/form-data">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">New DVIR Entry</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Inspection Type *
              <select
                name="inspection_type"
                required
                defaultValue="pre_trip"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                <option value="pre_trip">Pre-Trip</option>
                <option value="post_trip">Post-Trip</option>
              </select>
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Driver *
              <select
                name="driver_id"
                required
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                <option value="">Select driver</option>
                {drivers.map((driver) => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Inspection Date *
              <input
                required
                type="date"
                name="inspection_date"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Odometer
              <input
                type="number"
                name="odometer"
                min={0}
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="flex items-center gap-3 rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm font-medium text-[var(--text-primary)] md:col-span-2">
              <input
                type="checkbox"
                name="passed"
                defaultChecked
                className="h-4 w-4 accent-[var(--brand-primary)]"
              />
              All items satisfactory (passed)
            </label>

            <fieldset className="space-y-2 rounded-lg border border-[var(--divider)] bg-[var(--surface)] p-3 md:col-span-2">
              <legend className="px-1 text-xs font-medium text-[var(--text-secondary)]">Defects (if failed)</legend>
              <div className="grid gap-2 md:grid-cols-2">
                {COMMON_DVIR_DEFECTS.map((defect) => (
                  <label key={defect} className="flex items-center gap-2 text-xs text-[var(--text-body)]">
                    <input
                      type="checkbox"
                      name="defects"
                      value={defect}
                      className="h-4 w-4 accent-[var(--brand-primary)]"
                    />
                    {defect}
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Notes
              <textarea
                rows={3}
                name="notes"
                className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Signature (image)
              <input
                type="file"
                name="signature_file"
                accept="image/*"
                className="block w-full text-sm text-[var(--text-body)]"
              />
            </label>
          </div>

          <Button type="submit">Save DVIR</Button>
        </form>
      </CardContent>
    </Card>
  );
}
