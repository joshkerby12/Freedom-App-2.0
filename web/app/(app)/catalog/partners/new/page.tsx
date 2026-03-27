import { createPartnerAction } from "@/app/(app)/catalog/partners/actions";
import { PartnerForm } from "@/components/catalog/partner-form";

export default function NewPartnerPage() {
  return (
    <section className="space-y-4">
      <PartnerForm
        title="Add Partner"
        description="Create a trade partner or subcontractor contact."
        submitLabel="Save Partner"
        cancelHref="/catalog/partners"
        action={createPartnerAction}
      />
    </section>
  );
}
