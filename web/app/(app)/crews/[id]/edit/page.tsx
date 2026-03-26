import { notFound } from "next/navigation";
import { CrewForm } from "@/components/crews/crew-form";
import { updateCrewAction } from "@/app/(app)/crews/actions";
import { getCrewDetail, listCrewLeadOptions } from "@/lib/crews/crew-service";
import { createClient } from "@/lib/supabase/server";

type EditCrewPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditCrewPage({ params }: EditCrewPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const [crew, crewLeadOptions] = await Promise.all([
    getCrewDetail(supabase, id),
    listCrewLeadOptions(supabase),
  ]);

  if (!crew) {
    notFound();
  }

  const boundUpdateAction = updateCrewAction.bind(null, crew.id);

  return (
    <section className="mx-auto w-full max-w-2xl space-y-4">
      <CrewForm
        title={`Edit ${crew.name}`}
        description="Update crew settings and lead assignment."
        submitLabel="Save Changes"
        cancelHref={`/crews/${crew.id}`}
        action={boundUpdateAction}
        crewLeadOptions={crewLeadOptions}
        initialValues={{
          name: crew.name,
          crewLeadId: crew.crewLead?.id ?? "",
          isActive: crew.isActive,
          notes: crew.notes ?? "",
        }}
      />
    </section>
  );
}
