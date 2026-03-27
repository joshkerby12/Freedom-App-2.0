import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getConfigs } from "@/lib/catalog/material-config-service";
import type { MaterialConfigType } from "@/lib/catalog/types";

type ConfigurationListPageProps = {
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

function humanizeConfigType(configType: MaterialConfigType): string {
  return configType
    .replaceAll("_", " ")
    .split(" ")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default async function ConfigurationListPage({
  searchParams,
}: ConfigurationListPageProps) {
  const params = await searchParams;
  const query = readQueryValue(params, "q");
  const saved = readQueryValue(params, "saved");
  const error = readQueryValue(params, "error");

  const configs = await getConfigs(query);

  const grouped = configs.reduce(
    (acc, config) => {
      const current = acc.get(config.config_type) ?? [];
      current.push(config);
      acc.set(config.config_type, current);
      return acc;
    },
    new Map<MaterialConfigType, typeof configs>(),
  );

  return (
    <section className="space-y-4">
      {saved ? <p className="auth-feedback-success">Configuration deleted.</p> : null}
      {error ? <p className="auth-feedback-error">{decodeURIComponent(error)}</p> : null}

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div>
            <CardTitle>Material Configurations</CardTitle>
            <CardDescription>
              Build reusable material role assignments by configuration type.
            </CardDescription>
          </div>
          <Link
            href="/catalog/configurations/new"
            className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
          >
            Add Configuration
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
                placeholder="Configuration name"
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

          {configs.length === 0 ? (
            <p className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-4 py-3 text-sm text-[var(--text-secondary)]">
              No configurations found.
            </p>
          ) : (
            <div className="space-y-4">
              {Array.from(grouped.entries()).map(([configType, records]) => (
                <div key={configType} className="space-y-2">
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                    {humanizeConfigType(configType)}
                  </h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    {records.map((config) => (
                      <Link
                        key={config.id}
                        href={`/catalog/configurations/${config.id}/edit`}
                        className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] p-3 transition-colors hover:border-[var(--brand-primary)]"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[var(--text-primary)]">
                              {config.name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                              {config.roles.length} roles assigned
                            </p>
                          </div>
                          {config.is_active ? (
                            <span className="rounded-full bg-[rgba(11,61,44,0.12)] px-2 py-1 text-xs font-semibold text-[var(--brand-accent)]">
                              Active
                            </span>
                          ) : (
                            <span className="rounded-full bg-[rgba(36,50,82,0.08)] px-2 py-1 text-xs font-semibold text-[var(--text-secondary)]">
                              Inactive
                            </span>
                          )}
                        </div>

                        {config.color ? (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {config.color.split("/").map((token) => {
                              const color = token.trim();
                              return (
                                <span
                                  key={`${config.id}-${color}`}
                                  className="inline-flex items-center gap-2 rounded-full border border-[var(--divider)] px-2 py-1 text-xs"
                                >
                                  <span
                                    className="h-3 w-3 rounded-full border border-[var(--divider)]"
                                    style={{ backgroundColor: color }}
                                  />
                                  {color}
                                </span>
                              );
                            })}
                          </div>
                        ) : null}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
