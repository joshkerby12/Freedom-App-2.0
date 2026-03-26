import { ClientListView } from "@/components/clients/client-list-view";
import { getClientLookups, listClients } from "@/lib/clients/service";
import type { ClientFilter, ClientSort } from "@/lib/clients/types";

type ParamsInput =
  | Record<string, string | string[] | undefined>
  | Promise<Record<string, string | string[] | undefined>>;

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return typeof value === "string" ? value : "";
}

function normalizeFilter(value: string): ClientFilter {
  if (
    value === "residential" ||
    value === "commercial" ||
    value === "incomplete" ||
    value === "overdue"
  ) {
    return value;
  }

  return "all";
}

function normalizeSort(value: string): ClientSort {
  return value === "last_contacted" ? "last_contacted" : "name";
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: ParamsInput;
}) {
  const params = await Promise.resolve(searchParams);

  const query = {
    search: readParam(params, "search"),
    filter: normalizeFilter(readParam(params, "filter")),
    sort: normalizeSort(readParam(params, "sort")),
    clientTypeId: readParam(params, "clientTypeId"),
    tagId: readParam(params, "tagId"),
  };

  const [lookups, clients] = await Promise.all([
    getClientLookups(),
    listClients(query),
  ]);

  return <ClientListView clients={clients} lookups={lookups} query={query} />;
}
