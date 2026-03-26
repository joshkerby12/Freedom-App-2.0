import Link from "next/link";
import { CommunicationLogForm } from "@/components/clients/communication-log-form";
import { formatDate, formatDateTime, isOverdue } from "@/lib/clients/helpers";
import type { ClientDetailRecord } from "@/lib/clients/types";

type ClientDetailSectionsProps = {
  client: ClientDetailRecord;
};

function SectionHeader({
  title,
  manageHref,
}: {
  title: string;
  manageHref: string;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <Link
        href={manageHref}
        className="text-sm font-medium text-[var(--brand-primary)] hover:underline"
      >
        Manage
      </Link>
    </div>
  );
}

export function ClientDetailSections({ client }: ClientDetailSectionsProps) {
  return (
    <div className="space-y-4">
      <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Client Info
        </summary>
        <div className="mt-4 space-y-2 text-sm text-[var(--text-body)]">
          <SectionHeader title="Client Info" manageHref={`/clients/${client.id}/manage/info`} />
          <p>
            <strong>Type:</strong> {client.isCompany ? "Commercial" : "Residential"}
          </p>
          {client.companyName ? (
            <p>
              <strong>Company:</strong> {client.companyName}
            </p>
          ) : null}
          <p>
            <strong>Name:</strong> {client.firstName} {client.lastName}
          </p>
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
            <strong>Payment Terms:</strong> {client.paymentTermsName ?? "—"}
          </p>
          <p>
            <strong>Sales Lead:</strong> {client.salesLeadName ?? "—"}
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            {client.isPreviousCustomer ? (
              <span className="rounded-full bg-[rgba(11,61,44,0.12)] px-3 py-1 text-xs font-medium text-[var(--brand-accent)]">
                Previous customer
              </span>
            ) : null}
            {client.hasPortalAccess ? (
              <span className="rounded-full bg-[rgba(66,170,226,0.16)] px-3 py-1 text-xs font-medium text-[var(--brand-primary-dark)]">
                Portal access
              </span>
            ) : null}
          </div>
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Referral
        </summary>
        <div className="mt-4 space-y-2 text-sm text-[var(--text-body)]">
          <SectionHeader title="Referral" manageHref={`/clients/${client.id}/manage/referral`} />
          <p>
            <strong>Funnel:</strong> {client.referralFunnelName ?? "—"}
          </p>
          <p>
            <strong>Source:</strong> {client.referralSourceName ?? "—"}
          </p>
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Contact Schedule
        </summary>
        <div className="mt-4 space-y-2 text-sm text-[var(--text-body)]">
          <SectionHeader title="Contact Schedule" manageHref={`/clients/${client.id}/manage/schedule`} />
          <p>
            <strong>Frequency:</strong> {client.contactFrequency ?? "—"}
          </p>
          <p>
            <strong>Last Contacted:</strong> {formatDate(client.lastContacted)}
          </p>
          <p>
            <strong>Next Contact:</strong> {formatDate(client.nextContact)}{" "}
            {isOverdue(client.nextContact) ? (
              <span className="ml-2 rounded-full bg-[rgba(211,47,47,0.12)] px-2 py-1 text-xs font-semibold text-[var(--error)]">
                Overdue
              </span>
            ) : null}
          </p>
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Addresses
        </summary>
        <div className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
          <SectionHeader title="Addresses" manageHref={`/clients/${client.id}/manage/addresses`} />
          {client.addresses.length ? (
            client.addresses.map((address) => (
              <div key={address.id} className="rounded-lg border border-[var(--divider)] p-3">
                <p className="font-medium text-[var(--text-primary)]">
                  {address.streetAddress}, {address.city}, {address.state} {address.zip}
                </p>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {address.type.replace("_", " ")}
                  {address.isPrimary ? " · Primary" : ""}
                </p>
              </div>
            ))
          ) : (
            <p className="text-[var(--text-secondary)]">No addresses yet.</p>
          )}
        </div>
      </details>

      {client.isCompany ? (
        <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
          <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Contacts
          </summary>
          <div className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
            <SectionHeader title="Contacts" manageHref={`/clients/${client.id}/manage/contacts`} />
            {client.contacts.length ? (
              client.contacts.map((contact) => (
                <div key={contact.id} className="rounded-lg border border-[var(--divider)] p-3">
                  <p className="font-medium text-[var(--text-primary)]">
                    {contact.firstName} {contact.lastName ?? ""}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-secondary)]">
                    {contact.role ?? "No role"}
                    {contact.isPrimary ? " · Primary" : ""}
                  </p>
                  <p className="mt-1">{contact.phone ?? contact.email ?? "No phone/email"}</p>
                </div>
              ))
            ) : (
              <p className="text-[var(--text-secondary)]">No contacts yet.</p>
            )}
          </div>
        </details>
      ) : null}

      <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Tags
        </summary>
        <div className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
          <SectionHeader title="Tags" manageHref={`/clients/${client.id}/manage/tags`} />
          {client.tags.length ? (
            <div className="flex flex-wrap gap-2">
              {client.tags.map((tag) => (
                <span
                  key={tag.id}
                  className="rounded-full border border-[var(--divider)] px-3 py-1 text-xs font-medium"
                >
                  {tag.name}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-secondary)]">No tags assigned.</p>
          )}
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Notes
        </summary>
        <div className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
          <SectionHeader title="Notes" manageHref={`/clients/${client.id}/manage/notes`} />
          {client.notesFeed.length ? (
            client.notesFeed.map((note) => (
              <article key={note.id} className="rounded-lg border border-[var(--divider)] p-3">
                <p className="text-xs text-[var(--text-secondary)]">
                  {note.authorName} · {formatDate(note.createdAt)}
                </p>
                <p className="mt-2">{note.body}</p>
                {note.attachments.length ? (
                  <div className="mt-2 space-y-1 text-xs">
                    {note.attachments.map((attachment) => (
                      <a
                        key={attachment.id}
                        href={attachment.fileUrl}
                        className="block text-[var(--brand-primary)] underline"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {attachment.fileName ?? "Attachment"}
                      </a>
                    ))}
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <p className="text-[var(--text-secondary)]">No notes yet.</p>
          )}
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Tasks
        </summary>
        <div className="mt-4 space-y-3 text-sm text-[var(--text-body)]">
          <SectionHeader title="Tasks" manageHref={`/clients/${client.id}/manage/tasks`} />
          {client.tasksFeed.length ? (
            client.tasksFeed.map((task) => (
              <article key={task.id} className="rounded-lg border border-[var(--divider)] p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                  <span className="rounded-full bg-[rgba(66,170,226,0.12)] px-2 py-1 text-xs">
                    {task.priority}
                  </span>
                  <span className="rounded-full bg-[rgba(36,50,82,0.08)] px-2 py-1 text-xs">
                    {task.status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-[var(--text-secondary)]">
                  {task.assigneeName} · Due {formatDate(task.dueDate)}
                </p>
                {task.description ? <p className="mt-2">{task.description}</p> : null}
              </article>
            ))
          ) : (
            <p className="text-[var(--text-secondary)]">No tasks yet.</p>
          )}
        </div>
      </details>

      <details open className="rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-4 shadow-[var(--shadow-card)]">
        <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
          Communications
        </summary>
        <div className="mt-4 space-y-4 text-sm text-[var(--text-body)]">
          <SectionHeader title="Communications" manageHref={`/clients/${client.id}/manage/communications`} />
          <CommunicationLogForm clientId={client.id} />

          {client.communications.length ? (
            <div className="space-y-3">
              {client.communications.map((communication) => (
                <article key={communication.id} className="rounded-lg border border-[var(--divider)] p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[rgba(66,170,226,0.12)] px-2 py-1 text-xs font-semibold">
                      {communication.method.replace("_", " ")}
                    </span>
                    <span className="rounded-full bg-[rgba(11,61,44,0.12)] px-2 py-1 text-xs font-semibold text-[var(--brand-accent)]">
                      {communication.direction}
                    </span>
                    {communication.result ? (
                      <span className="rounded-full bg-[rgba(36,50,82,0.08)] px-2 py-1 text-xs">
                        {communication.result.replaceAll("_", " ")}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-xs text-[var(--text-secondary)]">
                    {formatDateTime(communication.occurredAt)} · {communication.loggedByName}
                  </p>
                  {communication.notes ? <p className="mt-2">{communication.notes}</p> : null}
                  {communication.attachments.length ? (
                    <div className="mt-2 space-y-1 text-xs">
                      {communication.attachments.map((attachment) => (
                        <a
                          key={attachment.id}
                          href={attachment.fileUrl}
                          className="block text-[var(--brand-primary)] underline"
                          target="_blank"
                          rel="noreferrer"
                        >
                          {attachment.fileName ?? "Attachment"}
                        </a>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          ) : (
            <p className="text-[var(--text-secondary)]">No communications logged yet.</p>
          )}
        </div>
      </details>
    </div>
  );
}
