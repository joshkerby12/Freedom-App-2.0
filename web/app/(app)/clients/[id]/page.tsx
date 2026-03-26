import Link from "next/link";
import { notFound } from "next/navigation";
import { ClientDetailSections } from "@/components/clients/client-detail-sections";
import { safeGetClientDetail } from "@/lib/clients/service";

type ParamsInput = Promise<{ id: string }> | { id: string };

export default async function ClientDetailPage({
  params,
}: {
  params: ParamsInput;
}) {
  const resolvedParams = await Promise.resolve(params);
  const result = await safeGetClientDetail(resolvedParams.id);

  if (result.error) {
    if (result.error.toLowerCase().includes("not found")) {
      notFound();
    }

    return (
      <section className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Client Detail</h1>
        <p className="mt-2 text-sm text-[var(--error)]">{result.error}</p>
      </section>
    );
  }

  const client = result.data;
  if (!client) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            Client Detail
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {client.displayName}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {client.clientTypeName ? (
              <span className="rounded-full bg-[rgba(66,170,226,0.12)] px-2 py-1 text-xs font-semibold text-[var(--brand-primary-dark)]">
                {client.clientTypeName}
              </span>
            ) : null}
            {client.isIncomplete ? (
              <span className="rounded-full bg-[rgba(255,193,7,0.2)] px-2 py-1 text-xs font-semibold text-[#7a5900]">
                Incomplete
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            href="/clients"
            className="rounded-lg border border-[var(--divider)] px-4 py-2 text-sm font-semibold text-[var(--text-body)]"
          >
            Back to List
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            Edit Client
          </Link>
        </div>
      </header>

      <ClientDetailSections client={client} />
    </section>
  );
}
