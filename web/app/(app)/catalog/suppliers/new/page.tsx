import { createSupplierAction } from "@/app/(app)/catalog/suppliers/actions";
import { SupplierForm } from "@/components/catalog/supplier-form";

export default function NewSupplierPage() {
  return (
    <section className="space-y-4">
      <SupplierForm
        title="Add Supplier"
        description="Create a supplier record and manage one or more locations."
        submitLabel="Save Supplier"
        cancelHref="/catalog/suppliers"
        action={createSupplierAction}
      />
    </section>
  );
}
