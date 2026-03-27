import { notFound } from "next/navigation";
import { deleteProductAction, updateProductAction } from "@/app/(app)/catalog/products/actions";
import { ProductForm } from "@/components/catalog/product-form";
import { Button } from "@/components/ui/button";
import { getProduct, getProductCatalogLookupOptions } from "@/lib/catalog/product-catalog-service";

type EditProductPageProps = {
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

export default async function EditProductPage({ params, searchParams }: EditProductPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const [product, lookupOptions] = await Promise.all([
    getProduct(id),
    getProductCatalogLookupOptions(),
  ]);

  if (!product) {
    notFound();
  }

  const error = readQueryValue(query, "error");

  return (
    <section className="space-y-4">
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <div className="flex justify-end">
        <form action={deleteProductAction.bind(null, id)}>
          <Button
            variant="destructive"
            type="submit"
            disabled={product.is_system_template}
          >
            Delete Product
          </Button>
        </form>
      </div>

      <ProductForm
        title="Edit Product"
        description="Update product details, inputs, and component formulas."
        submitLabel="Save Changes"
        cancelHref={`/catalog/products/${id}`}
        action={updateProductAction.bind(null, id)}
        lookupOptions={lookupOptions}
        initialProduct={product}
      />
    </section>
  );
}
