import { notFound } from "next/navigation";
import {
  deleteConfigurationAction,
  updateConfigurationAction,
} from "@/app/(app)/catalog/configurations/actions";
import { MaterialConfigForm } from "@/components/catalog/material-config-form";
import { Button } from "@/components/ui/button";
import { getConfig, getMaterialConfigItemOptions } from "@/lib/catalog/material-config-service";

type EditConfigurationPageProps = {
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

export default async function EditConfigurationPage({
  params,
  searchParams,
}: EditConfigurationPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const [config, itemOptions] = await Promise.all([
    getConfig(id),
    getMaterialConfigItemOptions(),
  ]);

  if (!config) {
    notFound();
  }

  const saved = readQueryValue(query, "saved");
  const error = readQueryValue(query, "error");

  return (
    <section className="space-y-4">
      {saved ? <p className="auth-feedback-success">Configuration saved.</p> : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <div className="flex justify-end">
        <form action={deleteConfigurationAction.bind(null, id)}>
          <Button variant="destructive" type="submit">
            Delete Configuration
          </Button>
        </form>
      </div>

      <MaterialConfigForm
        title="Edit Material Configuration"
        description="Update role assignments and active status."
        submitLabel="Save Changes"
        cancelHref="/catalog/configurations"
        action={updateConfigurationAction.bind(null, id)}
        itemOptions={itemOptions}
        initialConfig={config}
      />
    </section>
  );
}
