import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteItemAction, markItemReviewedAction } from "@/app/(app)/catalog/items/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getItem } from "@/lib/catalog/catalog-service";

type ItemDetailPageProps = {
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

function formatNumber(value: number | null): string {
  return value === null ? "—" : String(value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function ItemDetailPage({ params, searchParams }: ItemDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const item = await getItem(id);

  if (!item) {
    notFound();
  }

  const saved = readQueryValue(query, "saved");
  const error = readQueryValue(query, "error");

  return (
    <section className="space-y-4">
      {saved ? <p className="auth-feedback-success">Item updated successfully.</p> : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{item.name}</CardTitle>
            <CardDescription>
              {item.unit} {item.is_active ? "• Active" : "• Inactive"}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            {item.is_overdue ? (
              <form action={markItemReviewedAction.bind(null, item.id)}>
                <Button type="submit" variant="secondary">
                  Mark Reviewed
                </Button>
              </form>
            ) : null}
            <Link href={`/catalog/items/${item.id}/edit`}>
              <Button variant="secondary">Edit</Button>
            </Link>
            <form action={deleteItemAction.bind(null, item.id)}>
              <Button variant="destructive" type="submit">
                Delete
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Item</p>
              <p><strong>Description:</strong> {item.description ?? "—"}</p>
              <p><strong>Unit:</strong> {item.unit}</p>
              <p><strong>Color:</strong> {item.color ?? "—"}</p>
            </div>

            <div className="space-y-2 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Pricing</p>
              <p><strong>Default Cost:</strong> {formatCurrency(item.default_cost)}</p>
              <p><strong>Default Sell Price:</strong> {formatCurrency(item.default_sell_price)}</p>
              <p><strong>Default Markup %:</strong> {formatNumber(item.default_markup_pct)}</p>
              <p><strong>Waste %:</strong> {formatNumber(item.waste_pct)}</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Specs</p>
              <p><strong>Length (in):</strong> {formatNumber(item.spec?.length_in ?? null)}</p>
              <p><strong>Width (in):</strong> {formatNumber(item.spec?.width_in ?? null)}</p>
              <p><strong>Height/Depth (in):</strong> {formatNumber(item.spec?.height_depth_in ?? null)}</p>
              <p><strong>Spread Rate:</strong> {formatNumber(item.spec?.spread_rate_sqft_per_inch ?? null)}</p>
              <p><strong>Face Feet:</strong> {formatNumber(item.spec?.face_feet ?? null)}</p>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Extra Specs</p>
              {!item.spec?.extra_specs || Object.keys(item.spec.extra_specs).length === 0 ? (
                <p>—</p>
              ) : (
                <ul className="space-y-1">
                  {Object.entries(item.spec.extra_specs).map(([key, value]) => (
                    <li key={key}><strong>{key}:</strong> {String(value)}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="space-y-2 rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Price Review</p>
              <p><strong>Frequency (days):</strong> {formatNumber(item.price_review_frequency_days)}</p>
              <p><strong>Last Reviewed:</strong> {formatDate(item.last_price_updated_at)}</p>
              <p><strong>Next Due:</strong> {formatDate(item.review_due_date)}</p>
              <p>
                <strong>Status:</strong>{" "}
                {item.is_overdue ? `${item.days_overdue} days overdue` : "Current"}
              </p>
              <p><strong>Auto Increase %:</strong> {formatNumber(item.price_auto_increase_pct)}</p>
              <p><strong>Auto Increase Months:</strong> {formatNumber(item.price_auto_increase_months)}</p>
              <p><strong>Next Increase Date:</strong> {formatDate(item.price_next_increase_date)}</p>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
            <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Rounding Rules</p>
            <div className="grid gap-2 md:grid-cols-2">
              <p><strong>Quantity Type:</strong> {item.quantity_type}</p>
              <p><strong>Round To:</strong> {formatNumber(item.round_to)}</p>
              <p><strong>Minimum Qty:</strong> {formatNumber(item.minimum_qty)}</p>
              <p><strong>Package Unit:</strong> {item.package_unit ?? "—"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 text-sm text-[var(--text-body)]">
            <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Supplier Links</p>
            {item.suppliers.length === 0 ? (
              <p>No supplier links on this item.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      <th className="px-2 py-1">Supplier</th>
                      <th className="px-2 py-1">Unit Cost</th>
                      <th className="px-2 py-1">Last Price</th>
                      <th className="px-2 py-1">Flags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.suppliers.map((supplier) => (
                      <tr key={supplier.id}>
                        <td className="px-2 py-2">
                          <Link
                            href={`/catalog/suppliers/${supplier.supplier_id}`}
                            className="font-semibold text-[var(--brand-primary)] hover:underline"
                          >
                            {supplier.supplier_name}
                          </Link>
                          {supplier.supplier_location_name ? (
                            <p className="text-xs text-[var(--text-secondary)]">
                              {supplier.supplier_location_name}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-2 py-2">{formatCurrency(supplier.unit_cost)}</td>
                        <td className="px-2 py-2">{formatDate(supplier.last_price_date)}</td>
                        <td className="px-2 py-2">
                          {supplier.is_preferred ? (
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
