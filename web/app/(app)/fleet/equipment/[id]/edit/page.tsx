import { notFound, redirect } from "next/navigation";
import { EquipmentForm } from "@/components/fleet/equipment-form";
import { getEquipmentById, updateEquipment } from "@/lib/fleet/equipment-service";
import { readEquipmentUpsertInput } from "@/lib/fleet/equipment-form-data";

type EquipmentEditPageProps = {
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

export default async function EquipmentEditPage({
  params,
  searchParams,
}: EquipmentEditPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const equipment = await getEquipmentById(id);
  if (!equipment) {
    notFound();
  }

  const errorMessage = readQueryValue(query, "error");

  async function updateEquipmentAction(formData: FormData) {
    "use server";

    let destination = `/fleet/equipment/${id}/edit`;

    try {
      const payload = readEquipmentUpsertInput(formData);
      await updateEquipment(id, payload);
      destination = `/fleet/equipment/${id}?saved=updated`;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update equipment.";
      destination = `/fleet/equipment/${id}/edit?error=${encodeURIComponent(message)}`;
    }

    redirect(destination);
  }

  return (
    <section className="space-y-4">
      {errorMessage ? (
        <p className="auth-feedback-error">{decodeURIComponent(errorMessage)}</p>
      ) : null}
      <EquipmentForm
        title="Edit Equipment"
        subtitle="Update equipment details and compliance dates."
        submitLabel="Save Changes"
        action={updateEquipmentAction}
        cancelHref={`/fleet/equipment/${id}`}
        defaultValues={equipment}
      />
    </section>
  );
}
