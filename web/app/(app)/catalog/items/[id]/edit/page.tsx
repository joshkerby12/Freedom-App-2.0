import { notFound } from "next/navigation";
import { updateItemAction } from "@/app/(app)/catalog/items/actions";
import { ItemForm } from "@/components/catalog/item-form";
import { getItem, getItemSupplierOptions } from "@/lib/catalog/catalog-service";

type EditCatalogItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCatalogItemPage({ params }: EditCatalogItemPageProps) {
  const { id } = await params;

  const [item, supplierOptions] = await Promise.all([
    getItem(id),
    getItemSupplierOptions(),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <ItemForm
        title="Edit Catalog Item"
        description="Update pricing, specs, and supplier links."
        submitLabel="Save Changes"
        cancelHref={`/catalog/items/${id}`}
        action={updateItemAction.bind(null, id)}
        supplierOptions={supplierOptions}
        initialItem={item}
      />
    </section>
  );
}
