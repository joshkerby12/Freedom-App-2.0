import { ClientForm } from "@/components/clients/client-form";
import { getClientLookups } from "@/lib/clients/service";

export default async function NewClientPage() {
  const lookups = await getClientLookups();

  return (
    <ClientForm
      title="Create Client"
      submitLabel="Save Client"
      lookups={lookups}
    />
  );
}
