import { createItemAction } from "@/app/(app)/catalog/items/actions";
import { ItemForm } from "@/components/catalog/item-form";
import { getItemSupplierOptions } from "@/lib/catalog/catalog-service";

export default async function NewCatalogItemPage() {
  const supplierOptions = await getItemSupplierOptions();

  return (
    <section className="space-y-4">
      <ItemForm
        title="Add Catalog Item"
        description="Create an item with pricing, specs, and supplier links."
        submitLabel="Save Item"
        cancelHref="/catalog/items"
        action={createItemAction}
        supplierOptions={supplierOptions}
      />
    </section>
  );
}
