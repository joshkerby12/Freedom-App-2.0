import { notFound } from "next/navigation";
import { updatePartnerAction } from "@/app/(app)/catalog/partners/actions";
import { PartnerForm } from "@/components/catalog/partner-form";
import { getPartner } from "@/lib/catalog/partner-service";

type EditPartnerPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditPartnerPage({ params }: EditPartnerPageProps) {
  const { id } = await params;
  const partner = await getPartner(id);

  if (!partner) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <PartnerForm
        title="Edit Partner"
        description="Update trade partner details and notes."
        submitLabel="Save Changes"
        cancelHref={`/catalog/partners/${id}`}
        action={updatePartnerAction.bind(null, id)}
        initialPartner={partner}
      />
    </section>
  );
}
