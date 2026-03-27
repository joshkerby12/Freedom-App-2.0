"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  markAllItemsReviewedAction,
  markItemReviewedAction,
  updateItemCostAction,
} from "@/app/(app)/catalog/items/actions";
import { Button } from "@/components/ui/button";
import type { CatalogItemListItem } from "@/lib/catalog/types";

type ItemListProps = {
  items: CatalogItemListItem[];
  unitOptions: string[];
};

const initialCostActionState = {
  error: null as string | null,
};

function formatCurrency(value: number | null): string {
  if (value === null) {
    return "—";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value + "T00:00:00");
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function PriceReviewInlineEditor({ item }: { item: CatalogItemListItem }) {
  const [state, formAction, pending] = useActionState(
    updateItemCostAction.bind(null, item.id),
    initialCostActionState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor={`defaultCost-${item.id}`}>
        Default Cost
      </label>
      <input
        id={`defaultCost-${item.id}`}
        name="defaultCost"
        defaultValue={item.default_cost === null ? "" : String(item.default_cost)}
        type="number"
        step="0.01"
        className="h-9 w-28 rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-2 text-sm text-[var(--text-body)]"
      />
      <Button type="submit" variant="secondary" loading={pending}>
        Save Cost
      </Button>
      <button
        formAction={markItemReviewedAction.bind(null, item.id)}
        type="submit"
        className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--divider)] px-3 text-xs font-semibold text-[var(--text-body)] transition-colors hover:bg-[var(--surface-elevated)]"
      >
        Mark Reviewed
      </button>
      {state.error ? <p className="text-xs text-[var(--error)]">{state.error}</p> : null}
    </form>
  );
}

export function ItemList({ items, unitOptions }: ItemListProps) {
  const [search, setSearch] = useState("");
  const [selectedUnit, setSelectedUnit] = useState<string>("all");
  const [needsReviewOnly, setNeedsReviewOnly] = useState(false);

  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        if (selectedUnit !== "all" && item.unit !== selectedUnit) {
          return false;
        }

        if (needsReviewOnly && !item.is_overdue) {
          return false;
        }

        if (!search.trim()) {
          return true;
        }

        return item.name.toLowerCase().includes(search.trim().toLowerCase());
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [items, needsReviewOnly, search, selectedUnit]);

  const overdueCount = useMemo(
    () => items.filter((item) => item.is_overdue).length,
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
          Search by item name
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search items..."
            className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
          />
        </label>

        <label className="flex items-end gap-2 text-xs font-medium text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={needsReviewOnly}
            onChange={(event) => setNeedsReviewOnly(event.target.checked)}
            className="h-4 w-4 accent-[var(--brand-primary)]"
          />
          Needs Review ({overdueCount})
        </label>

        <Link
          href="/catalog/items/new"
          className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
        >
          Add Item
        </Link>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedUnit("all")}
          className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
            selectedUnit === "all"
              ? "border-[var(--brand-primary)] bg-[rgba(66,170,226,0.15)] text-[var(--brand-primary-dark)]"
              : "border-[var(--divider)] text-[var(--text-body)] hover:bg-[var(--surface-elevated)]"
          }`}
        >
          All Units
        </button>
        {unitOptions.map((unit) => (
          <button
            key={unit}
            type="button"
            onClick={() => setSelectedUnit(unit)}
            className={`rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
              selectedUnit === unit
                ? "border-[var(--brand-primary)] bg-[rgba(66,170,226,0.15)] text-[var(--brand-primary-dark)]"
                : "border-[var(--divider)] text-[var(--text-body)] hover:bg-[var(--surface-elevated)]"
            }`}
          >
            {unit}
          </button>
        ))}
      </div>

      {needsReviewOnly && overdueCount > 0 ? (
        <form action={markAllItemsReviewedAction}>
          <Button type="submit" variant="secondary">
            Mark All Reviewed
          </Button>
        </form>
      ) : null}

      {filteredItems.length === 0 ? (
        <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
          No catalog items match the current filters.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                <th className="px-3 py-1">Item</th>
                <th className="px-3 py-1">Unit</th>
                <th className="px-3 py-1">Cost</th>
                <th className="px-3 py-1">Review</th>
                <th className="px-3 py-1">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item) => (
                <tr key={item.id} className="rounded-lg bg-[var(--surface)] shadow-[var(--shadow-card)]">
                  <td className="rounded-l-lg px-3 py-3">
                    <Link href={`/catalog/items/${item.id}`} className="text-sm font-semibold text-[var(--text-primary)] hover:underline">
                      {item.name}
                    </Link>
                    {item.is_overdue ? (
                      <p className="mt-1 inline-flex rounded-full bg-[rgba(211,47,47,0.12)] px-2 py-1 text-xs font-semibold text-[var(--error)]">
                        {item.days_overdue} days overdue
                      </p>
                    ) : null}
                  </td>
                  <td className="px-3 py-3 text-sm text-[var(--text-body)]">{item.unit}</td>
                  <td className="px-3 py-3 text-sm text-[var(--text-body)]">{formatCurrency(item.default_cost)}</td>
                  <td className="px-3 py-3 text-sm text-[var(--text-secondary)]">
                    <div>Last: {formatDate(item.last_price_updated_at)}</div>
                    <div>Due: {formatDate(item.review_due_date)}</div>
                  </td>
                  <td className="rounded-r-lg px-3 py-3 text-sm text-[var(--text-body)]">
                    {item.is_overdue ? (
                      <PriceReviewInlineEditor item={item} />
                    ) : (
                      <span className="text-xs text-[var(--text-secondary)]">No review needed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
