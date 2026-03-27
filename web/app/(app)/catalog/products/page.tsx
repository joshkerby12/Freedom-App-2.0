import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProducts } from "@/lib/catalog/product-catalog-service";
import type { ProductCategory } from "@/lib/catalog/types";

type ProductListPageProps = {
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

const categoryOrder: ProductCategory[] = [
  "hardscape",
  "softscape",
  "drainage",
  "irrigation",
  "maintenance",
  "snow",
  "other",
];

function categoryLabel(category: ProductCategory): string {
  if (category === "hardscape") return "Hardscape";
  if (category === "softscape") return "Softscape";
  if (category === "drainage") return "Drainage";
  if (category === "irrigation") return "Irrigation";
  if (category === "maintenance") return "Maintenance";
  if (category === "snow") return "Snow";
  return "Other";
}

export default async function ProductListPage({ searchParams }: ProductListPageProps) {
  const params = await searchParams;
  const query = readQueryValue(params, "q");
  const showInactive = readQueryValue(params, "showInactive") === "1";
  const saved = readQueryValue(params, "saved");
  const error = readQueryValue(params, "error");

  const products = await getProducts({
    search: query,
    includeInactive: showInactive,
  });

  const grouped = products.reduce(
    (acc, product) => {
      const current = acc.get(product.category) ?? [];
      current.push(product);
      acc.set(product.category, current);
      return acc;
    },
    new Map<ProductCategory, typeof products>(),
  );

  return (
    <section className="space-y-4">
      {saved ? <p className="auth-feedback-success">Product deleted.</p> : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Product Catalog</CardTitle>
            <CardDescription>
              Browse product templates by category and pricing mode.
            </CardDescription>
          </div>
          <Link
            href="/catalog/products/new"
            className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
          >
            Add Product
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap items-end gap-3">
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Search
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Product name"
                className="h-11 w-64 rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="checkbox"
                name="showInactive"
                value="1"
                defaultChecked={showInactive}
              />
              Show inactive
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg border border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
            >
              Apply
            </button>
          </form>

          {products.length === 0 ? (
            <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              No products found.
            </p>
          ) : (
            <div className="space-y-4">
              {categoryOrder.map((category) => {
                const categoryProducts = grouped.get(category) ?? [];
                if (categoryProducts.length === 0) {
                  return null;
                }

                return (
                  <div key={category} className="space-y-2">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                      {categoryLabel(category)}
                    </h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {categoryProducts.map((product) => (
                        <Link
                          key={product.id}
                          href={`/catalog/products/${product.id}`}
                          className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 transition-colors hover:border-[var(--brand-primary)]"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {product.name}
                            </p>
                            {product.is_system_template ? (
                              <span className="rounded-full bg-[rgba(66,170,226,0.16)] px-2 py-1 text-xs font-semibold text-[var(--brand-primary-dark)]">
                                System
                              </span>
                            ) : null}
                            <span
                              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                                product.is_active
                                  ? "bg-[rgba(11,61,44,0.12)] text-[var(--brand-accent)]"
                                  : "bg-[rgba(36,50,82,0.08)] text-[var(--text-secondary)]"
                              }`}
                            >
                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-[var(--text-secondary)]">
                            Pricing mode: {product.pricing_mode}
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
