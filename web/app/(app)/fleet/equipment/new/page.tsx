import { redirect } from "next/navigation";
import { EquipmentForm } from "@/components/fleet/equipment-form";
import { createEquipment } from "@/lib/fleet/equipment-service";
import { readEquipmentUpsertInput } from "@/lib/fleet/equipment-form-data";

type EquipmentNewPageProps = {
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

export default async function EquipmentCreatePage({ searchParams }: EquipmentNewPageProps) {
  const params = await searchParams;
  const errorMessage = readQueryValue(params, "error");

  async function createEquipmentAction(formData: FormData) {
    "use server";

    let destination = "/fleet/equipment/new";

    try {
      const payload = readEquipmentUpsertInput(formData);
      const equipment = await createEquipment(payload);
      destination = `/fleet/equipment/${equipment.id}?saved=created`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to save equipment.";
      destination = `/fleet/equipment/new?error=${encodeURIComponent(message)}`;
    }

    redirect(destination);
  }

  return (
    <section className="space-y-4">
      {errorMessage ? (
        <p className="auth-feedback-error">{decodeURIComponent(errorMessage)}</p>
      ) : null}
      <EquipmentForm
        title="Add Equipment"
        subtitle="Create a new fleet asset record."
        submitLabel="Save Equipment"
        action={createEquipmentAction}
        cancelHref="/fleet/equipment"
      />
    </section>
  );
}
