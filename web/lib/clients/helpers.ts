import type { ClientAddressInput, ClientContactInput } from "@/lib/clients/types";

function trimmed(value?: string | null): string {
  return value?.trim() ?? "";
}

export function displayNameSuggestion(input: {
  isCompany: boolean;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
}): string {
  const companyName = trimmed(input.companyName);
  const fullName = [trimmed(input.firstName), trimmed(input.lastName)]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!input.isCompany) {
    return fullName;
  }

  if (companyName) {
    return companyName;
  }

  return fullName;
}

export function normalizeDateOnly(input: string | Date): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid date value.");
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(dateIso: string, days: number): string {
  const start = new Date(`${dateIso}T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) {
    throw new Error("Invalid date for addDays.");
  }

  start.setUTCDate(start.getUTCDate() + days);
  return normalizeDateOnly(start);
}

export function calculateNextContactDate(input: {
  lastContacted: string;
  contactFrequency?: string | null;
  contactFrequencyDays?: number | null;
}): string | null {
  const frequency = input.contactFrequency;
  if (!frequency) {
    return null;
  }

  const daysByFrequency: Record<string, number> = {
    monthly: 30,
    quarterly: 90,
    "bi-annually": 180,
    annually: 365,
  };

  if (frequency === "custom") {
    if (!input.contactFrequencyDays || input.contactFrequencyDays <= 0) {
      return null;
    }

    return addDays(input.lastContacted, input.contactFrequencyDays);
  }

  const days = daysByFrequency[frequency];
  if (!days) {
    return null;
  }

  return addDays(input.lastContacted, days);
}

export function sanitizeAddresses(addresses: ClientAddressInput[]): ClientAddressInput[] {
  return addresses
    .map((address) => ({
      ...address,
      streetAddress: trimmed(address.streetAddress),
      city: trimmed(address.city),
      state: trimmed(address.state),
      zip: trimmed(address.zip),
      notes: trimmed(address.notes) || undefined,
    }))
    .filter(
      (address) =>
        Boolean(address.streetAddress) &&
        Boolean(address.city) &&
        Boolean(address.state) &&
        Boolean(address.zip),
    );
}

export function sanitizeContacts(contacts: ClientContactInput[]): ClientContactInput[] {
  return contacts
    .map((contact) => ({
      ...contact,
      firstName: trimmed(contact.firstName),
      lastName: trimmed(contact.lastName) || undefined,
      phone: trimmed(contact.phone) || undefined,
      email: trimmed(contact.email) || undefined,
      role: trimmed(contact.role) || undefined,
      notes: trimmed(contact.notes) || undefined,
    }))
    .filter((contact) => Boolean(contact.firstName));
}

export function determineIncompleteStatus(input: {
  isCompany: boolean;
  companyName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  addresses: ClientAddressInput[];
  contacts: ClientContactInput[];
}): boolean {
  const hasAddress = input.addresses.length > 0;

  if (!input.isCompany) {
    const hasFirst = Boolean(trimmed(input.firstName));
    const hasLast = Boolean(trimmed(input.lastName));
    const hasPrimaryContact = Boolean(trimmed(input.phone) || trimmed(input.email));
    return !(hasFirst && hasLast && hasAddress && hasPrimaryContact);
  }

  const hasCompanyName = Boolean(trimmed(input.companyName));
  const hasCommercialContact = input.contacts.some(
    (contact) => Boolean(trimmed(contact.phone) || trimmed(contact.email)),
  );

  return !(hasCompanyName && hasAddress && hasCommercialContact);
}

export function isOverdue(nextContact: string | null): boolean {
  if (!nextContact) {
    return false;
  }

  const today = normalizeDateOnly(new Date());
  return nextContact < today;
}

export function formatDate(value: string | null): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function toLocalDatetimeInputValue(value: string | null): string {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const offsetMs = date.getTimezoneOffset() * 60 * 1000;
  const local = new Date(date.getTime() - offsetMs);
  return local.toISOString().slice(0, 16);
}
