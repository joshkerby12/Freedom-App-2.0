import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteSupplierAction } from "@/app/(app)/catalog/suppliers/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSupplier } from "@/lib/catalog/supplier-service";

type SupplierDetailPageProps = {
  params: Promise<{ id: string }>;
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

function formatCurrency(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

export default async function SupplierDetailPage({
  params,
  searchParams,
}: SupplierDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const supplier = await getSupplier(id);

  if (!supplier) {
    notFound();
  }

  const saved = readQueryValue(query, "saved");
  const error = readQueryValue(query, "error");

  return (
    <section className="space-y-4">
      {saved ? <p className="auth-feedback-success">Supplier updated successfully.</p> : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{supplier.name}</CardTitle>
            <CardDescription>
              {supplier.is_active ? "Active supplier" : "Inactive supplier"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href={`/catalog/suppliers/${supplier.id}/edit`}>
              <Button variant="secondary">Edit Supplier</Button>
            </Link>
            <form action={deleteSupplierAction.bind(null, supplier.id)}>
              <Button variant="destructive" type="submit">
                Delete
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
              <p><strong>Contact:</strong> {supplier.contact_name ?? "—"}</p>
              <p><strong>Phone:</strong> {supplier.phone ?? "—"}</p>
              <p><strong>Email:</strong> {supplier.email ?? "—"}</p>
              <p>
                <strong>Website:</strong>{" "}
                {supplier.website ? (
                  <a href={supplier.website} target="_blank" rel="noreferrer" className="text-[var(--brand-primary)] underline">
                    {supplier.website}
                  </a>
                ) : (
                  "—"
                )}
              </p>
            </div>

            <div className="space-y-2 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Locations</p>
              {supplier.locations.length === 0 ? (
                <p>No locations yet.</p>
              ) : (
                supplier.locations.map((location) => (
                  <div key={location.id} className="rounded-lg border border-[var(--divider)] p-2">
                    <p className="font-semibold text-[var(--text-primary)]">{location.name}</p>
                    <p>
                      {[location.street_address, location.city, location.state, location.zip]
                        .filter(Boolean)
                        .join(", ") || "No address"}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      lat/lng: {location.lat ?? "—"}, {location.lng ?? "—"}
                    </p>
                    {location.is_primary ? (
                      <span className="rounded-full bg-[rgba(66,170,226,0.16)] px-2 py-1 text-xs font-semibold text-[var(--brand-primary-dark)]">
                        Primary
                      </span>
                    ) : null}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
            <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Items Carried</p>
            {supplier.itemsCarried.length === 0 ? (
              <p>No linked catalog items yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      <th className="px-2 py-1">Item</th>
                      <th className="px-2 py-1">Unit</th>
                      <th className="px-2 py-1">Unit Cost</th>
                      <th className="px-2 py-1">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {supplier.itemsCarried.map((item) => (
                      <tr key={item.id}>
                        <td className="px-2 py-2">
                          <Link href={`/catalog/items/${item.id}`} className="font-semibold text-[var(--brand-primary)] hover:underline">
                            {item.name}
                          </Link>
                        </td>
                        <td className="px-2 py-2">{item.unit}</td>
                        <td className="px-2 py-2">{formatCurrency(item.unit_cost)}</td>
                        <td className="px-2 py-2">
                          {item.is_preferred ? (
                            <span className="rounded-full bg-[rgba(11,61,44,0.12)] px-2 py-1 text-xs font-semibold text-[var(--brand-accent)]">
                              Preferred
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
