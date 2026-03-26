import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExpiryBadge } from "@/components/fleet/expiry-badge";
import { listEquipment } from "@/lib/fleet/equipment-service";
import type { EquipmentType } from "@/lib/fleet/types";

type EquipmentPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function readQueryValue(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

const typeOptions: Array<{ value: EquipmentType | "all"; label: string }> = [
  { value: "all", label: "All Types" },
  { value: "truck", label: "Trucks" },
  { value: "trailer", label: "Trailers" },
  { value: "equipment", label: "Equipment" },
  { value: "attachment", label: "Attachments" },
];

export default async function EquipmentListPage({ searchParams }: EquipmentPageProps) {
  const params = await searchParams;
  const query = readQueryValue(params, "q");
  const type = (readQueryValue(params, "type") || "all") as EquipmentType | "all";
  const hasExpiryAlert = readQueryValue(params, "alert") === "1";
  const inactiveOnly = readQueryValue(params, "inactive") === "1";

  const equipment = await listEquipment({
    search: query,
    type,
    hasExpiryAlert,
    inactiveOnly,
    includeInactive: true,
  });

  return (
    <section className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Equipment</CardTitle>
            <p className="mt-1 text-sm text-[var(--text-secondary)]">
              Browse trucks, trailers, equipment, and attachments.
            </p>
          </div>
          <Link href="/fleet/equipment/new">
            <Button>Add Equipment</Button>
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-4">
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] md:col-span-2">
              Search
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Name, make, model, VIN, plate"
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>

            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Type
              <select
                name="type"
                defaultValue={type}
                className="h-10 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex flex-col justify-end gap-2">
              <label className="flex items-center gap-2 text-xs text-[var(--text-body)]">
                <input
                  type="checkbox"
                  name="alert"
                  value="1"
                  defaultChecked={hasExpiryAlert}
                  className="h-4 w-4 accent-[var(--brand-primary)]"
                />
                Has expiry alert
              </label>
              <label className="flex items-center gap-2 text-xs text-[var(--text-body)]">
                <input
                  type="checkbox"
                  name="inactive"
                  value="1"
                  defaultChecked={inactiveOnly}
                  className="h-4 w-4 accent-[var(--brand-primary)]"
                />
                Inactive only
              </label>
            </div>

            <div className="md:col-span-4">
              <Button type="submit" variant="secondary">
                Apply Filters
              </Button>
            </div>
          </form>

          {equipment.length === 0 ? (
            <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              No equipment records match this filter.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    <th className="px-3 py-1">Name</th>
                    <th className="px-3 py-1">Type</th>
                    <th className="px-3 py-1">Vehicle</th>
                    <th className="px-3 py-1">Status</th>
                    <th className="px-3 py-1">Docs</th>
                  </tr>
                </thead>
                <tbody>
                  {equipment.map((item) => (
                    <tr key={item.id} className="rounded-lg bg-[var(--surface)] shadow-[var(--shadow-card)]">
                      <td className="rounded-l-lg px-3 py-3 text-sm font-semibold text-[var(--text-primary)]">
                        <Link href={`/fleet/equipment/${item.id}`} className="hover:underline">
                          {item.name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-sm text-[var(--text-body)]">{item.type}</td>
                      <td className="px-3 py-3 text-sm text-[var(--text-secondary)]">
                        {[item.make, item.model, item.year].filter(Boolean).join(" ") || "—"}
                      </td>
                      <td className="px-3 py-3 text-sm">
                        {item.is_active ? (
                          <span className="rounded-full bg-[#e8f4ec] px-2 py-1 text-xs font-semibold text-[#24683a]">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-[#f0f0f0] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="rounded-r-lg px-3 py-3">
                        <ExpiryBadge status={item.expiry.overall} compact />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
