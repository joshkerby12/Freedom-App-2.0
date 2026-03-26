import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, formatDateTime } from "@/lib/clients/helpers";
import { safeGetClientDetail } from "@/lib/clients/service";

type ParamsInput =
  | Promise<{ id: string; section: string }>
  | { id: string; section: string };

const sectionMeta: Record<string, { title: string }> = {
  info: { title: "Manage Client Info" },
  referral: { title: "Manage Referral" },
  schedule: { title: "Manage Contact Schedule" },
  addresses: { title: "Manage Addresses" },
  contacts: { title: "Manage Contacts" },
  tags: { title: "Manage Tags" },
  notes: { title: "Manage Notes" },
  tasks: { title: "Manage Tasks" },
  communications: { title: "Manage Communications" },
};

export default async function ClientManageSectionPage({
  params,
}: {
  params: ParamsInput;
}) {
  const resolvedParams = await Promise.resolve(params);
  const section = resolvedParams.section;

  if (!sectionMeta[section]) {
    notFound();
  }

  const result = await safeGetClientDetail(resolvedParams.id);
  if (result.error || !result.data) {
    if (result.error?.toLowerCase().includes("not found")) {
      notFound();
    }

    return (
      <section className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Manage Section</h1>
        <p className="mt-2 text-sm text-[var(--error)]">
          {result.error ?? "Unable to load this section."}
        </p>
      </section>
    );
  }

  const client = result.data;

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.1em] text-[var(--text-secondary)]">
            {client.displayName}
          </p>
          <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
            {sectionMeta[section].title}
          </h1>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/clients/${client.id}`}
            className="rounded-lg border border-[var(--divider)] px-4 py-2 text-sm font-semibold text-[var(--text-body)]"
          >
            Back to Detail
          </Link>
          <Link
            href={`/clients/${client.id}/edit`}
            className="rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white"
          >
            Edit Client
          </Link>
        </div>
      </header>

      <div className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        {section === "info" ? (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Display Name:</strong> {client.displayName}
            </p>
            <p>
              <strong>Phone:</strong> {client.phone ?? "—"}
            </p>
            <p>
              <strong>Email:</strong> {client.email ?? "—"}
            </p>
            <p>
              <strong>Notes:</strong> {client.notes ?? "—"}
            </p>
          </div>
        ) : null}

        {section === "referral" ? (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Funnel:</strong> {client.referralFunnelName ?? "—"}
            </p>
            <p>
              <strong>Source:</strong> {client.referralSourceName ?? "—"}
            </p>
            <p>
              <strong>Sales Lead:</strong> {client.salesLeadName ?? "—"}
            </p>
          </div>
        ) : null}

        {section === "schedule" ? (
          <div className="space-y-2 text-sm">
            <p>
              <strong>Frequency:</strong> {client.contactFrequency ?? "—"}
            </p>
            <p>
              <strong>Last Contacted:</strong> {formatDate(client.lastContacted)}
            </p>
            <p>
              <strong>Next Contact:</strong> {formatDate(client.nextContact)}
            </p>
          </div>
        ) : null}

        {section === "addresses" ? (
          <div className="space-y-3">
            {client.addresses.map((address) => (
              <div key={address.id} className="rounded-lg border border-[var(--divider)] p-3 text-sm">
                <p>
                  {address.streetAddress}, {address.city}, {address.state} {address.zip}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {address.type.replace("_", " ")}
                  {address.isPrimary ? " · Primary" : ""}
                </p>
              </div>
            ))}
            {!client.addresses.length ? (
              <p className="text-sm text-[var(--text-secondary)]">No addresses found.</p>
            ) : null}
          </div>
        ) : null}

        {section === "contacts" ? (
          <div className="space-y-3">
            {client.contacts.map((contact) => (
              <div key={contact.id} className="rounded-lg border border-[var(--divider)] p-3 text-sm">
                <p>
                  {contact.firstName} {contact.lastName ?? ""}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {contact.phone ?? "No phone"} · {contact.email ?? "No email"}
                </p>
              </div>
            ))}
            {!client.contacts.length ? (
              <p className="text-sm text-[var(--text-secondary)]">No contacts found.</p>
            ) : null}
          </div>
        ) : null}

        {section === "tags" ? (
          <div className="flex flex-wrap gap-2">
            {client.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full border border-[var(--divider)] px-3 py-1 text-xs"
              >
                {tag.name}
              </span>
            ))}
            {!client.tags.length ? (
              <p className="text-sm text-[var(--text-secondary)]">No tags found.</p>
            ) : null}
          </div>
        ) : null}

        {section === "notes" ? (
          <div className="space-y-3">
            {client.notesFeed.map((note) => (
              <article key={note.id} className="rounded-lg border border-[var(--divider)] p-3 text-sm">
                <p className="text-xs text-[var(--text-secondary)]">
                  {note.authorName} · {formatDate(note.createdAt)}
                </p>
                <p className="mt-2">{note.body}</p>
              </article>
            ))}
            {!client.notesFeed.length ? (
              <p className="text-sm text-[var(--text-secondary)]">No notes found.</p>
            ) : null}
          </div>
        ) : null}

        {section === "tasks" ? (
          <div className="space-y-3">
            {client.tasksFeed.map((task) => (
              <article key={task.id} className="rounded-lg border border-[var(--divider)] p-3 text-sm">
                <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {task.assigneeName} · Due {formatDate(task.dueDate)} · {task.status}
                </p>
              </article>
            ))}
            {!client.tasksFeed.length ? (
              <p className="text-sm text-[var(--text-secondary)]">No tasks found.</p>
            ) : null}
          </div>
        ) : null}

        {section === "communications" ? (
          <div className="space-y-3">
            {client.communications.map((communication) => (
              <article
                key={communication.id}
                className="rounded-lg border border-[var(--divider)] p-3 text-sm"
              >
                <p className="font-medium text-[var(--text-primary)]">
                  {communication.method.replace("_", " ")} · {communication.direction}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {formatDateTime(communication.occurredAt)} · {communication.loggedByName}
                </p>
                {communication.notes ? <p className="mt-2">{communication.notes}</p> : null}
              </article>
            ))}
            {!client.communications.length ? (
              <p className="text-sm text-[var(--text-secondary)]">No communications found.</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}
