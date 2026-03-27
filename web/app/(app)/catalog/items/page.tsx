import { ItemList } from "@/components/catalog/item-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getItems, listItemUnits } from "@/lib/catalog/catalog-service";

type ItemListPageProps = {
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

export default async function ItemListPage({ searchParams }: ItemListPageProps) {
  const params = await searchParams;
  const saved = readQueryValue(params, "saved");
  const error = readQueryValue(params, "error");

  const [items, unitOptions] = await Promise.all([
    getItems({ includeInactive: true }),
    listItemUnits(),
  ]);

  return (
    <section className="space-y-4">
      {saved ? (
        <p className="auth-feedback-success">
          {saved === "deleted" ? "Item deleted." : "Catalog item changes saved."}
        </p>
      ) : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Item Catalog</CardTitle>
          <CardDescription>
            Search items, track overdue price reviews, and update costs inline.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ItemList items={items} unitOptions={unitOptions} />
        </CardContent>
      </Card>
    </section>
  );
}
