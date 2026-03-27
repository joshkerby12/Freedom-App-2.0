import { createProductAction } from "@/app/(app)/catalog/products/actions";
import { ProductForm } from "@/components/catalog/product-form";
import { getProductCatalogLookupOptions } from "@/lib/catalog/product-catalog-service";

export default async function NewProductPage() {
  const lookupOptions = await getProductCatalogLookupOptions();

  return (
    <section className="space-y-4">
      <ProductForm
        title="Add Product"
        description="Create a product template and configure inputs/components."
        submitLabel="Save Product"
        cancelHref="/catalog/products"
        action={createProductAction}
        lookupOptions={lookupOptions}
      />
    </section>
  );
}
