import Link from "next/link";
import { formatDate, isOverdue } from "@/lib/clients/helpers";
import type {
  ClientFilter,
  ClientListItem,
  ClientLookups,
  ClientSort,
} from "@/lib/clients/types";

type ClientListViewProps = {
  clients: ClientListItem[];
  lookups: ClientLookups;
  query: {
    search: string;
    filter: ClientFilter;
    sort: ClientSort;
    clientTypeId: string;
    tagId: string;
  };
};

function buildQueryString(query: Record<string, string>): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value) {
      params.set(key, value);
    }
  });

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

function filterChip(
  label: string,
  value: ClientFilter,
  currentFilter: ClientFilter,
  query: ClientListViewProps["query"],
){
  const href = `/clients${buildQueryString({
    ...query,
    filter: value,
  })}`;

  const active = value === currentFilter;

  return (
    <Link
      key={value}
      href={href}
      className={
        active
          ? "rounded-full bg-[var(--brand-primary)] px-3 py-1 text-xs font-semibold text-white"
          : "rounded-full border border-[var(--divider)] px-3 py-1 text-xs font-semibold text-[var(--text-body)]"
      }
    >
      {label}
    </Link>
  );
}

export function ClientListView({ clients, lookups, query }: ClientListViewProps) {
  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Clients</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Browse, filter, and manage all client records.
          </p>
        </div>
        <Link
          href="/clients/new"
          className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
        >
          Add Client
        </Link>
      </header>

      <form
        method="get"
        className="space-y-3 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]"
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)] lg:col-span-2">
            Search
            <input
              type="search"
              name="search"
              defaultValue={query.search}
              placeholder="Search by name, phone, or email"
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
            />
          </label>

          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Sort
            <select
              name="sort"
              defaultValue={query.sort}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="name">Name</option>
              <option value="last_contacted">Last Contacted</option>
            </select>
          </label>

          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Client Type
            <select
              name="clientTypeId"
              defaultValue={query.clientTypeId}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="">All types</option>
              {lookups.clientTypes.map((clientType) => (
                <option key={clientType.id} value={clientType.id}>
                  {clientType.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Tag
            <select
              name="tagId"
              defaultValue={query.tagId}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
            >
              <option value="">All tags</option>
              {lookups.tags.map((tag) => (
                <option key={tag.id} value={tag.id}>
                  {tag.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <input type="hidden" name="filter" value={query.filter} />

        <div className="flex flex-wrap items-center gap-2">
          {filterChip("All", "all", query.filter, query)}
          {filterChip("Residential", "residential", query.filter, query)}
          {filterChip("Commercial", "commercial", query.filter, query)}
          {filterChip("Incomplete", "incomplete", query.filter, query)}
          {filterChip("Overdue Contact", "overdue", query.filter, query)}
        </div>

        <button
          type="submit"
          className="rounded-lg border border-[var(--divider)] px-4 py-2 text-sm font-semibold text-[var(--text-body)]"
        >
          Apply Filters
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-[var(--divider)] bg-[var(--surface)] shadow-[var(--shadow-card)]">
        {clients.length ? (
          <ul className="divide-y divide-[var(--divider)]">
            {clients.map((client) => (
              <li key={client.id}>
                <Link
                  href={`/clients/${client.id}`}
                  className="block space-y-2 px-4 py-3 transition-colors hover:bg-[var(--surface-elevated)]"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {client.displayName}
                    </p>
                    {client.clientTypeName ? (
                      <span className="rounded-full bg-[rgba(66,170,226,0.12)] px-2 py-1 text-xs font-medium text-[var(--brand-primary-dark)]">
                        {client.clientTypeName}
                      </span>
                    ) : null}
                    {client.isIncomplete ? (
                      <span className="rounded-full bg-[rgba(255,193,7,0.2)] px-2 py-1 text-xs font-semibold text-[#7a5900]">
                        Incomplete
                      </span>
                    ) : null}
                    {isOverdue(client.nextContact) ? (
                      <span className="rounded-full bg-[rgba(211,47,47,0.14)] px-2 py-1 text-xs font-semibold text-[var(--error)]">
                        Overdue contact
                      </span>
                    ) : null}
                  </div>

                  <p className="text-xs text-[var(--text-secondary)]">
                    {client.phone ?? client.email ?? "No contact info"}
                  </p>

                  <div className="flex flex-wrap items-center gap-2">
                    {client.tagNames.map((tagName) => (
                      <span
                        key={`${client.id}-${tagName}`}
                        className="rounded-full border border-[var(--divider)] px-2 py-1 text-xs text-[var(--text-secondary)]"
                      >
                        {tagName}
                      </span>
                    ))}
                    <span className="text-xs text-[var(--text-secondary)]">
                      Last contacted: {formatDate(client.lastContacted)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-[var(--text-secondary)]">No clients found.</p>
            <Link href="/clients/new" className="mt-3 inline-block text-sm font-semibold text-[var(--brand-primary)]">
              Add your first client
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
