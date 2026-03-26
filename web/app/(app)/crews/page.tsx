import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listActiveCrews, type CrewListItem } from "@/lib/crews/crew-service";
import { createClient } from "@/lib/supabase/server";

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

function renderMemberCount(memberCount: number): string {
  return memberCount === 1 ? "1 member" : `${memberCount} members`;
}

export default async function CrewsPage() {
  let crews: CrewListItem[] = [];
  let errorMessage: string | null = null;

  try {
    const supabase = await createClient();
    crews = await listActiveCrews(supabase);
  } catch (error) {
    errorMessage = getErrorMessage(error, "Unable to load crews right now.");
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Crews</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Active crews with lead assignment and member counts.
          </p>
        </div>
        <Link
          href="/crews/new"
          className="inline-flex min-h-11 min-w-[88px] items-center justify-center rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-[var(--text-on-primary)] transition-colors hover:bg-[var(--brand-primary-dark)]"
        >
          Add Crew
        </Link>
      </header>

      {errorMessage ? (
        <Card>
          <CardHeader>
            <CardTitle>Could not load crews</CardTitle>
            <CardDescription>{errorMessage}</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!errorMessage && crews.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No active crews yet</CardTitle>
            <CardDescription>Create your first crew to start assigning leads and members.</CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {!errorMessage && crews.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {crews.map((crew) => (
            <Card key={crew.id} className="h-full">
              <CardHeader className="mb-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{crew.name}</CardTitle>
                    <CardDescription>
                      {crew.crewLeadName ? `Lead: ${crew.crewLeadName}` : "Lead: Unassigned"}
                    </CardDescription>
                  </div>
                  <span className="rounded-full bg-[rgba(11,61,44,0.12)] px-2 py-1 text-xs font-semibold text-[var(--brand-accent)]">
                    {crew.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-[var(--text-body)]">{renderMemberCount(crew.memberCount)}</p>
                {crew.notes ? (
                  <p className="line-clamp-2 text-sm text-[var(--text-secondary)]">{crew.notes}</p>
                ) : (
                  <p className="text-sm text-[var(--text-secondary)]">No notes</p>
                )}
                <Link
                  href={`/crews/${crew.id}`}
                  className="inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]"
                >
                  View details
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
