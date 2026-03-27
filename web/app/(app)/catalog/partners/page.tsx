import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPartners } from "@/lib/catalog/partner-service";

type PartnerListPageProps = {
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

export default async function PartnerListPage({ searchParams }: PartnerListPageProps) {
  const params = await searchParams;
  const query = readQueryValue(params, "q");
  const saved = readQueryValue(params, "saved");
  const error = readQueryValue(params, "error");

  const partners = await getPartners(query);

  return (
    <section className="space-y-4">
      {saved ? <p className="auth-feedback-success">Partner deleted.</p> : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Partners</CardTitle>
            <CardDescription>
              Manage subcontractor and partner company records.
            </CardDescription>
          </div>
          <Link
            href="/catalog/partners/new"
            className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
          >
            Add Partner
          </Link>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="flex flex-wrap items-end gap-3">
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Search
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Company or trade"
                className="h-11 w-64 rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              />
            </label>
            <button
              type="submit"
              className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg border border-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
            >
              Search
            </button>
          </form>

          {partners.length === 0 ? (
            <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              No partners found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                    <th className="px-3 py-1">Company</th>
                    <th className="px-3 py-1">Contact</th>
                    <th className="px-3 py-1">Trade</th>
                    <th className="px-3 py-1">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.map((partner) => (
                    <tr key={partner.id} className="rounded-lg bg-[var(--surface)] shadow-[var(--shadow-card)]">
                      <td className="rounded-l-lg px-3 py-3 text-sm font-semibold text-[var(--text-primary)]">
                        <Link href={`/catalog/partners/${partner.id}`} className="hover:underline">
                          {partner.company_name}
                        </Link>
                      </td>
                      <td className="px-3 py-3 text-sm text-[var(--text-body)]">
                        {partner.contact_name ?? partner.email ?? "—"}
                      </td>
                      <td className="px-3 py-3 text-sm text-[var(--text-body)]">
                        {partner.trade_type ?? "—"}
                      </td>
                      <td className="rounded-r-lg px-3 py-3 text-sm">
                        {partner.is_active ? (
                          <span className="rounded-full bg-[rgba(11,61,44,0.12)] px-2 py-1 text-xs font-semibold text-[var(--brand-accent)]">
                            Active
                          </span>
                        ) : (
                          <span className="rounded-full bg-[rgba(36,50,82,0.08)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
