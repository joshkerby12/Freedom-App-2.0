import { createConfigurationAction } from "@/app/(app)/catalog/configurations/actions";
import { MaterialConfigForm } from "@/components/catalog/material-config-form";
import { getMaterialConfigItemOptions } from "@/lib/catalog/material-config-service";

export default async function NewConfigurationPage() {
  const itemOptions = await getMaterialConfigItemOptions();

  return (
    <section className="space-y-4">
      <MaterialConfigForm
        title="Add Material Configuration"
        description="Choose a config type and assign required catalog item roles."
        submitLabel="Save Configuration"
        cancelHref="/catalog/configurations"
        action={createConfigurationAction}
        itemOptions={itemOptions}
      />
    </section>
  );
}
