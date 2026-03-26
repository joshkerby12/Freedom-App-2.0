import Link from "next/link";
import { notFound } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getCrewDetail } from "@/lib/crews/crew-service";
import { createClient } from "@/lib/supabase/server";

type CrewDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatEmploymentType(value: string | null): string {
  if (!value) {
    return "Not set";
  }

  return value
    .split("_")
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" ");
}

export default async function CrewDetailPage({ params }: CrewDetailPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const crew = await getCrewDetail(supabase, id);

  if (!crew) {
    notFound();
  }

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{crew.name}</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Crew details, member roster, and notes.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex min-h-9 items-center rounded-full bg-[rgba(11,61,44,0.12)] px-3 text-xs font-semibold text-[var(--brand-accent)]">
            {crew.isActive ? "Active" : "Inactive"}
          </span>
          <Link
            href={`/crews/${crew.id}/edit`}
            className="inline-flex min-h-9 items-center justify-center rounded-lg border border-[var(--brand-primary)] px-3 text-sm font-semibold text-[var(--brand-primary)] transition-colors hover:bg-[rgba(66,170,226,0.08)]"
          >
            Edit Crew
          </Link>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Crew Lead</CardTitle>
          <CardDescription>Primary lead assigned to this crew.</CardDescription>
        </CardHeader>
        <CardContent>
          {crew.crewLead ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {crew.crewLead.displayName}
              </p>
              <p className="text-sm text-[var(--text-secondary)]">
                {crew.crewLead.roleName ?? "No role assigned"}
                {crew.crewLead.employeeTitle ? ` · ${crew.crewLead.employeeTitle}` : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">
              No crew lead is assigned for this crew.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Employees assigned through `employees.crew_id`.</CardDescription>
        </CardHeader>
        <CardContent>
          {crew.members.length === 0 ? (
            <p className="text-sm text-[var(--text-secondary)]">No members are assigned yet.</p>
          ) : (
            <ul className="space-y-2">
              {crew.members.map((member) => (
                <li
                  key={member.id}
                  className="rounded-lg border border-[var(--divider)] bg-[var(--surface-elevated)] px-3 py-2"
                >
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    {member.displayName}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {member.roleName ?? "No role"} · {formatEmploymentType(member.employmentType)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
          <CardDescription>Crew-level notes stored on the `crews` record.</CardDescription>
        </CardHeader>
        <CardContent>
          {crew.notes ? (
            <p className="whitespace-pre-wrap text-sm text-[var(--text-body)]">{crew.notes}</p>
          ) : (
            <p className="text-sm text-[var(--text-secondary)]">No notes recorded.</p>
          )}
        </CardContent>
      </Card>

      <Link
        href="/crews"
        className="inline-flex text-sm font-semibold text-[var(--brand-primary)] hover:text-[var(--brand-primary-dark)]"
      >
        Back to crews
      </Link>
    </section>
  );
}
