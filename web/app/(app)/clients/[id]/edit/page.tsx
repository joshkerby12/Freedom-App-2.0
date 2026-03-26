import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientForm } from "@/components/clients/client-form";
import { getClientLookups, safeGetClientDetail } from "@/lib/clients/service";

type ParamsInput = Promise<{ id: string }> | { id: string };

export default async function EditClientPage({
  params,
}: {
  params: ParamsInput;
}) {
  const resolvedParams = await Promise.resolve(params);
  const [lookups, detailResult] = await Promise.all([
    getClientLookups(),
    safeGetClientDetail(resolvedParams.id),
  ]);

  if (detailResult.error || !detailResult.data) {
    if (detailResult.error?.toLowerCase().includes("not found")) {
      notFound();
    }

    return (
      <section className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Edit Client</h1>
        <p className="mt-2 text-sm text-[var(--error)]">
          {detailResult.error ?? "Unable to load client."}
        </p>
        <Link
          href="/clients"
          className="mt-3 inline-block text-sm font-semibold text-[var(--brand-primary)]"
        >
          Return to clients
        </Link>
      </section>
    );
  }

  return (
    <ClientForm
      title="Edit Client"
      submitLabel="Save Changes"
      lookups={lookups}
      initialClient={detailResult.data}
    />
  );
}
