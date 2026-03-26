"use client";

import { useActionState, useMemo, useState } from "react";
import { saveClientAction } from "@/app/(app)/clients/actions";
import { initialClientFormActionState } from "@/app/(app)/clients/client-types";
import { displayNameSuggestion } from "@/lib/clients/helpers";
import type {
  ClientAddressInput,
  ClientContactInput,
  ClientDetailRecord,
  ClientLookups,
} from "@/lib/clients/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type EditableAddress = ClientAddressInput;
type EditableContact = ClientContactInput;

type ClientFormProps = {
  title: string;
  submitLabel: string;
  lookups: ClientLookups;
  initialClient?: ClientDetailRecord;
};

function emptyAddress(): EditableAddress {
  return {
    type: "job_site",
    streetAddress: "",
    city: "",
    state: "",
    zip: "",
    isPrimary: true,
    notes: "",
  };
}

function emptyContact(): EditableContact {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "",
    isPrimary: true,
    notes: "",
  };
}

function normalizeAddresses(addresses: ClientDetailRecord["addresses"] | undefined): EditableAddress[] {
  if (!addresses?.length) {
    return [emptyAddress()];
  }

  return addresses.map((address) => ({
    type: address.type,
    streetAddress: address.streetAddress,
    city: address.city,
    state: address.state,
    zip: address.zip,
    isPrimary: address.isPrimary,
    notes: address.notes ?? "",
  }));
}

function normalizeContacts(contacts: ClientDetailRecord["contacts"] | undefined): EditableContact[] {
  if (!contacts?.length) {
    return [emptyContact()];
  }

  return contacts.map((contact) => ({
    firstName: contact.firstName,
    lastName: contact.lastName ?? "",
    phone: contact.phone ?? "",
    email: contact.email ?? "",
    role: contact.role ?? "",
    isPrimary: contact.isPrimary,
    notes: contact.notes ?? "",
  }));
}

export function ClientForm({
  title,
  submitLabel,
  lookups,
  initialClient,
}: ClientFormProps) {
  const [state, formAction, pending] = useActionState(
    saveClientAction,
    initialClientFormActionState,
  );

  const [isCompany, setIsCompany] = useState(initialClient?.isCompany ?? false);
  const [companyName, setCompanyName] = useState(initialClient?.companyName ?? "");
  const [firstName, setFirstName] = useState(initialClient?.firstName ?? "");
  const [lastName, setLastName] = useState(initialClient?.lastName ?? "");
  const [displayName, setDisplayName] = useState(
    initialClient?.displayName === "Unnamed client" ? "" : initialClient?.displayName ?? "",
  );
  const [addresses, setAddresses] = useState<EditableAddress[]>(
    normalizeAddresses(initialClient?.addresses),
  );
  const [contacts, setContacts] = useState<EditableContact[]>(
    normalizeContacts(initialClient?.contacts),
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialClient?.tags.map((tag) => tag.id) ?? [],
  );
  const [selectedFunnelId, setSelectedFunnelId] = useState(
    initialClient?.referralFunnelId ?? "",
  );
  const [selectedSourceId, setSelectedSourceId] = useState(
    initialClient?.referralSourceId ?? "",
  );
  const [contactFrequency, setContactFrequency] = useState(
    initialClient?.contactFrequency ?? "",
  );

  const selectedFunnel = lookups.referralFunnels.find(
    (funnel) => funnel.id === selectedFunnelId,
  );
  const referralSourceOptions = lookups.referralSources.filter(
    (source) => source.referralFunnelId === selectedFunnelId,
  );

  const displayNamePlaceholder = useMemo(
    () =>
      displayNameSuggestion({
        isCompany,
        companyName,
        firstName,
        lastName,
      }) || "Display name suggestion",
    [isCompany, companyName, firstName, lastName],
  );

  function updateAddress(index: number, patch: Partial<EditableAddress>) {
    setAddresses((current) =>
      current.map((address, addressIndex) =>
        addressIndex === index
          ? { ...address, ...patch }
          : patch.isPrimary
            ? { ...address, isPrimary: false }
            : address,
      ),
    );
  }

  function addAddress() {
    setAddresses((current) => [...current, { ...emptyAddress(), isPrimary: false }]);
  }

  function removeAddress(index: number) {
    setAddresses((current) => {
      const next = current.filter((_, addressIndex) => addressIndex !== index);
      if (!next.length) {
        return [emptyAddress()];
      }

      if (!next.some((address) => address.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }

      return next;
    });
  }

  function updateContact(index: number, patch: Partial<EditableContact>) {
    setContacts((current) =>
      current.map((contact, contactIndex) =>
        contactIndex === index
          ? { ...contact, ...patch }
          : patch.isPrimary
            ? { ...contact, isPrimary: false }
            : contact,
      ),
    );
  }

  function addContact() {
    setContacts((current) => [...current, { ...emptyContact(), isPrimary: false }]);
  }

  function removeContact(index: number) {
    setContacts((current) => {
      const next = current.filter((_, contactIndex) => contactIndex !== index);
      if (!next.length) {
        return [emptyContact()];
      }

      if (!next.some((contact) => contact.isPrimary)) {
        next[0] = { ...next[0], isPrimary: true };
      }

      return next;
    });
  }

  function toggleTag(tagId: string) {
    setSelectedTagIds((current) =>
      current.includes(tagId)
        ? current.filter((currentTagId) => currentTagId !== tagId)
        : [...current, tagId],
    );
  }

  const shouldShowReferralSource = selectedFunnel?.requiresSource ?? false;

  return (
    <section className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">{title}</h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Residential and commercial clients share one form with dynamic fields.
        </p>
      </header>

      <form action={formAction} className="space-y-6 rounded-xl border border-[var(--divider)] bg-[var(--surface)] p-5 shadow-[var(--shadow-card)]">
        <input type="hidden" name="clientId" value={initialClient?.id ?? ""} />
        <input type="hidden" name="addressesJson" value={JSON.stringify(addresses)} />
        <input type="hidden" name="contactsJson" value={JSON.stringify(contacts)} />
        <input type="hidden" name="tagIdsJson" value={JSON.stringify(selectedTagIds)} />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Client Type
          </h2>
          <div className="flex flex-wrap gap-3">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="radio"
                name="isCompany"
                value="false"
                checked={!isCompany}
                onChange={() => setIsCompany(false)}
              />
              Residential
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="radio"
                name="isCompany"
                value="true"
                checked={isCompany}
                onChange={() => setIsCompany(true)}
              />
              Commercial / Organization
            </label>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <Input
            label="First Name"
            name="firstName"
            required
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
          />
          <Input
            label="Last Name"
            name="lastName"
            required
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
          />
          {isCompany ? (
            <Input
              label="Company Name"
              name="companyName"
              required
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
            />
          ) : (
            <input type="hidden" name="companyName" value={companyName} />
          )}
          <Input
            label="Display Name (Optional)"
            name="displayName"
            placeholder={displayNamePlaceholder}
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
          />
          <Input label="Phone" name="phone" defaultValue={initialClient?.phone ?? ""} />
          <Input label="Email" name="email" type="email" defaultValue={initialClient?.email ?? ""} />
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Client Type
            <select
              name="clientTypeId"
              defaultValue={initialClient?.clientTypeId ?? ""}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
            >
              <option value="">Select type</option>
              {lookups.clientTypes.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Sales Lead
            <select
              name="salesLead"
              defaultValue={initialClient?.salesLeadId ?? ""}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
            >
              <option value="">Select sales lead</option>
              {lookups.salesLeads.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.fullName}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Referral Funnel
            <select
              name="referralFunnelId"
              value={selectedFunnelId}
              onChange={(event) => {
                setSelectedFunnelId(event.target.value);
                setSelectedSourceId("");
              }}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
            >
              <option value="">Select funnel</option>
              {lookups.referralFunnels.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          {shouldShowReferralSource ? (
            <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
              Referral Source
              <select
                name="referralSourceId"
                value={selectedSourceId}
                onChange={(event) => setSelectedSourceId(event.target.value)}
                className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
              >
                <option value="">Select source</option>
                {referralSourceOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <input type="hidden" name="referralSourceId" value="" />
          )}

          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Payment Terms
            <select
              name="paymentTermsId"
              defaultValue={initialClient?.paymentTermsId ?? ""}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
            >
              <option value="">Select payment terms</option>
              {lookups.paymentTerms.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Contact Frequency
            <select
              name="contactFrequency"
              value={contactFrequency}
              onChange={(event) => setContactFrequency(event.target.value)}
              className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm text-[var(--text-body)]"
            >
              <option value="">No schedule</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="bi-annually">Bi-Annually</option>
              <option value="annually">Annually</option>
              <option value="custom">Custom</option>
            </select>
          </label>

          {contactFrequency === "custom" ? (
            <Input
              label="Custom Frequency Days"
              name="contactFrequencyDays"
              type="number"
              min={1}
              defaultValue={
                typeof initialClient?.contactFrequencyDays === "number"
                  ? String(initialClient.contactFrequencyDays)
                  : ""
              }
            />
          ) : (
            <input type="hidden" name="contactFrequencyDays" value="" />
          )}
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Tags
          </h2>
          <div className="flex flex-wrap gap-2">
            {lookups.tags.map((tag) => (
              <label
                key={tag.id}
                className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[var(--divider)] px-3 py-1 text-xs text-[var(--text-body)]"
              >
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(tag.id)}
                  onChange={() => toggleTag(tag.id)}
                />
                {tag.name}
              </label>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Addresses
          </h2>
          {addresses.map((address, index) => (
            <div key={`address-${index}`} className="space-y-3 rounded-lg border border-[var(--divider)] p-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
                  Address Type
                  <select
                    value={address.type}
                    onChange={(event) =>
                      updateAddress(index, {
                        type: event.target.value as EditableAddress["type"],
                      })
                    }
                    className="h-11 w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 text-sm"
                  >
                    <option value="billing">Billing</option>
                    <option value="job_site">Job Site</option>
                    <option value="both">Both</option>
                  </select>
                </label>

                <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
                  <input
                    type="checkbox"
                    checked={address.isPrimary}
                    onChange={(event) =>
                      updateAddress(index, {
                        isPrimary: event.target.checked,
                      })
                    }
                  />
                  Primary Address
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Street"
                  value={address.streetAddress}
                  onChange={(event) =>
                    updateAddress(index, { streetAddress: event.target.value })
                  }
                />
                <Input
                  label="City"
                  value={address.city}
                  onChange={(event) => updateAddress(index, { city: event.target.value })}
                />
                <Input
                  label="State"
                  value={address.state}
                  onChange={(event) => updateAddress(index, { state: event.target.value })}
                />
                <Input
                  label="Zip"
                  value={address.zip}
                  onChange={(event) => updateAddress(index, { zip: event.target.value })}
                />
              </div>

              <Input
                label="Address Notes"
                value={address.notes}
                onChange={(event) => updateAddress(index, { notes: event.target.value })}
              />

              {addresses.length > 1 ? (
                <Button type="button" variant="text" onClick={() => removeAddress(index)}>
                  Remove Address
                </Button>
              ) : null}
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={addAddress}>
            Add Another Address
          </Button>
        </section>

        {isCompany ? (
          <section className="space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              Contacts
            </h2>
            {contacts.map((contact, index) => (
              <div key={`contact-${index}`} className="space-y-3 rounded-lg border border-[var(--divider)] p-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label="First Name"
                    value={contact.firstName}
                    onChange={(event) =>
                      updateContact(index, { firstName: event.target.value })
                    }
                  />
                  <Input
                    label="Last Name"
                    value={contact.lastName}
                    onChange={(event) => updateContact(index, { lastName: event.target.value })}
                  />
                  <Input
                    label="Phone"
                    value={contact.phone}
                    onChange={(event) => updateContact(index, { phone: event.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    value={contact.email}
                    onChange={(event) => updateContact(index, { email: event.target.value })}
                  />
                  <Input
                    label="Role"
                    value={contact.role}
                    onChange={(event) => updateContact(index, { role: event.target.value })}
                  />
                  <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
                    <input
                      type="checkbox"
                      checked={contact.isPrimary}
                      onChange={(event) =>
                        updateContact(index, {
                          isPrimary: event.target.checked,
                        })
                      }
                    />
                    Primary Contact
                  </label>
                </div>

                <Input
                  label="Contact Notes"
                  value={contact.notes}
                  onChange={(event) => updateContact(index, { notes: event.target.value })}
                />

                {contacts.length > 1 ? (
                  <Button type="button" variant="text" onClick={() => removeContact(index)}>
                    Remove Contact
                  </Button>
                ) : null}
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={addContact}>
              Add Another Contact
            </Button>
          </section>
        ) : null}

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
            Flags & Notes
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="checkbox"
                name="isPreviousCustomer"
                defaultChecked={initialClient?.isPreviousCustomer ?? false}
              />
              Previous Customer
            </label>
            <label className="inline-flex items-center gap-2 text-sm text-[var(--text-body)]">
              <input
                type="checkbox"
                name="hasPortalAccess"
                defaultChecked={initialClient?.hasPortalAccess ?? false}
              />
              Portal Access Enabled
            </label>
          </div>
          <label className="space-y-2 text-xs font-medium text-[var(--text-secondary)]">
            Internal Notes
            <textarea
              name="notes"
              defaultValue={initialClient?.notes ?? ""}
              rows={4}
              className="w-full rounded-lg border border-[var(--divider)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-body)]"
            />
          </label>
        </section>

        {state.error ? <p className="auth-feedback-error">{state.error}</p> : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" loading={pending}>
            {submitLabel}
          </Button>
          <Button type="button" variant="secondary" onClick={() => window.history.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </section>
  );
}
