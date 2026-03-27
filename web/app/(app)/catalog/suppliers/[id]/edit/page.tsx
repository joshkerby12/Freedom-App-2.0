import { notFound } from "next/navigation";
import { updateSupplierAction } from "@/app/(app)/catalog/suppliers/actions";
import { SupplierForm } from "@/components/catalog/supplier-form";
import { getSupplier } from "@/lib/catalog/supplier-service";

type EditSupplierPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditSupplierPage({ params }: EditSupplierPageProps) {
  const { id } = await params;
  const supplier = await getSupplier(id);

  if (!supplier) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <SupplierForm
        title="Edit Supplier"
        description="Update supplier contact information and location records."
        submitLabel="Save Changes"
        cancelHref={`/catalog/suppliers/${id}`}
        action={updateSupplierAction.bind(null, id)}
        initialSupplier={supplier}
      />
    </section>
  );
}
