import Link from "next/link";
import { notFound } from "next/navigation";
import { deleteProductAction } from "@/app/(app)/catalog/products/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getProduct } from "@/lib/catalog/product-catalog-service";

type ProductDetailPageProps = {
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

function formatNumber(value: number | null): string {
  return value === null ? "—" : String(value);
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: ProductDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const product = await getProduct(id);

  if (!product) {
    notFound();
  }

  const saved = readQueryValue(query, "saved");
  const error = readQueryValue(query, "error");

  return (
    <section className="space-y-4">
      {saved ? <p className="auth-feedback-success">Product saved.</p> : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>{product.name}</CardTitle>
            <CardDescription>
              {product.category} • {product.pricing_mode}
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {product.is_system_template ? (
              <span className="rounded-full bg-[rgba(66,170,226,0.16)] px-2 py-1 text-xs font-semibold text-[var(--brand-primary-dark)]">
                System Template
              </span>
            ) : null}
            <Link href={`/catalog/products/${product.id}/edit`}>
              <Button variant="secondary">Edit Product</Button>
            </Link>
            <form action={deleteProductAction.bind(null, product.id)}>
              <Button
                variant="destructive"
                type="submit"
                disabled={product.is_system_template}
              >
                Delete
              </Button>
            </form>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 text-sm text-[var(--text-body)]">
            <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 space-y-1">
              <p><strong>Install Rate:</strong> {formatNumber(product.install_rate)}</p>
              <p><strong>Minimum Hours:</strong> {formatNumber(product.minimum_hours)}</p>
              <p><strong>Flat Rate Price:</strong> {formatNumber(product.flat_rate_price)}</p>
              <p><strong>Labor Override:</strong> {formatNumber(product.labor_rate_override)}</p>
              <p><strong>Equipment Override:</strong> {formatNumber(product.equipment_rate_override)}</p>
              <p><strong>QB Item Code:</strong> {product.quickbooks_item_code ?? "—"}</p>
              <p><strong>Status:</strong> {product.is_active ? "Active" : "Inactive"}</p>
            </div>
            <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3">
              <p className="text-sm font-semibold text-[var(--text-primary)]">Default Description</p>
              <p className="mt-1 text-sm text-[var(--text-body)]">
                {product.default_description ?? "—"}
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3">
            <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Inputs</p>
            {product.inputs.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No inputs configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      <th className="px-2 py-1">Label</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Unit</th>
                      <th className="px-2 py-1">Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.inputs.map((input) => (
                      <tr key={input.id}>
                        <td className="px-2 py-2">{input.label}</td>
                        <td className="px-2 py-2">{input.input_type}</td>
                        <td className="px-2 py-2">{input.unit_label ?? "—"}</td>
                        <td className="px-2 py-2">{input.is_required ? "Yes" : "No"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3">
            <p className="mb-2 text-sm font-semibold text-[var(--text-primary)]">Components</p>
            {product.components.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)]">No components configured.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                      <th className="px-2 py-1">Label</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Input Ref</th>
                      <th className="px-2 py-1">Formula</th>
                    </tr>
                  </thead>
                  <tbody>
                    {product.components.map((component) => (
                      <tr key={component.id}>
                        <td className="px-2 py-2">{component.label}</td>
                        <td className="px-2 py-2">{component.component_type}</td>
                        <td className="px-2 py-2">{component.input_ref ?? component.configuration_input_ref ?? "—"}</td>
                        <td className="px-2 py-2 font-mono text-xs">{component.qty_formula}</td>
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
