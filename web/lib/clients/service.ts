import { createClient } from "@/lib/supabase/server";
import {
  calculateNextContactDate,
  determineIncompleteStatus,
  displayNameSuggestion,
  normalizeDateOnly,
  sanitizeAddresses,
  sanitizeContacts,
} from "@/lib/clients/helpers";
import type {
  ClientDetailRecord,
  ClientFilter,
  ClientListItem,
  ClientListQuery,
  ClientLookups,
  CommunicationRecord,
  CreateCommunicationInput,
  LookupOption,
  SaveClientInput,
  SalesEmployeeOption,
} from "@/lib/clients/types";

const COMMUNICATION_ATTACHMENT_BUCKET = "communication-attachments";

type ViewerContext = {
  orgId: string;
  employeeId: string | null;
};

function stringifyError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error";
}

function assertNoError(
  error: { message: string } | null,
  context: string,
): void {
  if (error) {
    throw new Error(`${context}: ${error.message}`);
  }
}

function toOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function toBoolean(value: unknown): boolean {
  return value === true;
}

function employeeDisplayName(row: Record<string, unknown>): string {
  const explicit = toOptionalString(row.display_name);
  if (explicit) {
    return explicit;
  }

  const firstName = toOptionalString(row.first_name) ?? "";
  const lastName = toOptionalString(row.last_name) ?? "";
  const fallback = `${firstName} ${lastName}`.trim();
  return fallback || "Unknown employee";
}

function dedupe(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

function sanitizeSearchTerm(value: string): string {
  return value.replace(/[(),]/g, " ").replace(/\s+/g, " ").trim();
}

function optionFromRow(row: Record<string, unknown>): LookupOption {
  return {
    id: String(row.id),
    name: String(row.name),
    color: toOptionalString(row.color),
  };
}

async function getViewerContext(): Promise<ViewerContext> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  assertNoError(userError, "Failed to read session user");

  if (!user) {
    throw new Error("You must be signed in to access clients.");
  }

  const { data: membership, error: membershipError } = await supabase
    .from("org_members")
    .select("org_id")
    .eq("profile_id", user.id)
    .limit(1)
    .maybeSingle();

  assertNoError(membershipError, "Failed to read organization membership");

  const orgId = toOptionalString(membership?.org_id);
  if (!orgId) {
    throw new Error("No organization membership found for the current user.");
  }

  const { data: employee } = await supabase
    .from("employees")
    .select("id")
    .eq("org_id", orgId)
    .eq("supabase_auth_uid", user.id)
    .limit(1)
    .maybeSingle();

  return {
    orgId,
    employeeId: toOptionalString(employee?.id),
  };
}

async function getEmployeeNameMap(
  orgId: string,
  employeeIds: string[],
): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!employeeIds.length) {
    return map;
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("employees")
    .select("id,first_name,last_name,display_name")
    .eq("org_id", orgId)
    .in("id", employeeIds);

  assertNoError(error, "Failed to load employee names");

  for (const row of data ?? []) {
    map.set(String(row.id), employeeDisplayName(row));
  }

  return map;
}

async function getLookupNameMap(
  orgId: string,
  table: "client_types" | "payment_terms" | "referral_funnels" | "referral_sources" | "tags",
  ids: string[],
): Promise<Map<string, { name: string; color: string | null }>> {
  const map = new Map<string, { name: string; color: string | null }>();
  if (!ids.length) {
    return map;
  }

  const supabase = await createClient();
  const fields = table === "payment_terms" || table === "referral_sources" ? "id,name" : "id,name,color";

  const response = await supabase
    .from(table)
    .select(fields)
    .eq("org_id", orgId)
    .in("id", ids);
  const data = response.data as unknown[] | null;
  const error = response.error as { message: string } | null;

  assertNoError(error, `Failed to load ${table}`);

  for (const row of data ?? []) {
    const typedRow = row as Record<string, unknown>;
    map.set(String(typedRow.id), {
      name: String(typedRow.name),
      color: toOptionalString(typedRow.color),
    });
  }

  return map;
}

export async function getClientLookups(): Promise<ClientLookups> {
  const { orgId } = await getViewerContext();
  const supabase = await createClient();

  const [clientTypesResult, tagsResult, funnelsResult, sourcesResult, paymentTermsResult, salesResult] =
    await Promise.all([
      supabase
        .from("client_types")
        .select("id,name,color")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("tags")
        .select("id,name,color")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("referral_funnels")
        .select("id,name,requires_source")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("referral_sources")
        .select("id,name,referral_funnel_id")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("name", { ascending: true }),
      supabase
        .from("payment_terms")
        .select("id,name,days_until_due")
        .eq("org_id", orgId)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .order("name", { ascending: true }),
      supabase
        .from("employees")
        .select("id,first_name,last_name,display_name")
        .eq("org_id", orgId)
        .eq("is_sales", true)
        .order("first_name", { ascending: true }),
    ]);

  assertNoError(clientTypesResult.error, "Failed to load client types");
  assertNoError(tagsResult.error, "Failed to load tags");
  assertNoError(funnelsResult.error, "Failed to load referral funnels");
  assertNoError(sourcesResult.error, "Failed to load referral sources");
  assertNoError(paymentTermsResult.error, "Failed to load payment terms");
  assertNoError(salesResult.error, "Failed to load sales leads");

  const salesLeads: SalesEmployeeOption[] = (salesResult.data ?? []).map((row) => ({
    id: String(row.id),
    fullName: employeeDisplayName(row),
  }));

  return {
    clientTypes: (clientTypesResult.data ?? []).map(optionFromRow),
    tags: (tagsResult.data ?? []).map(optionFromRow),
    referralFunnels: (funnelsResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      requiresSource: row.requires_source === true,
    })),
    referralSources: (sourcesResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      referralFunnelId: String(row.referral_funnel_id),
    })),
    paymentTerms: (paymentTermsResult.data ?? []).map((row) => ({
      id: String(row.id),
      name: String(row.name),
      daysUntilDue: Number(row.days_until_due ?? 0),
    })),
    salesLeads,
  };
}

export async function listClients(query: ClientListQuery): Promise<ClientListItem[]> {
  const { orgId } = await getViewerContext();
  const supabase = await createClient();

  const filter: ClientFilter = query.filter ?? "all";
  const sort = query.sort ?? "name";

  let scopedIds: string[] | null = null;
  if (query.tagId) {
    const { data: tagRows, error: tagError } = await supabase
      .from("client_tags")
      .select("client_id")
      .eq("org_id", orgId)
      .eq("tag_id", query.tagId);

    assertNoError(tagError, "Failed to filter by tag");

    scopedIds = dedupe((tagRows ?? []).map((row) => toOptionalString(row.client_id)));
    if (!scopedIds.length) {
      return [];
    }
  }

  let request = supabase
    .from("clients")
    .select(
      "id,is_company,company_name,first_name,last_name,display_name,phone,email,client_type_id,last_contacted,next_contact,is_incomplete",
    )
    .eq("org_id", orgId);

  if (query.clientTypeId) {
    request = request.eq("client_type_id", query.clientTypeId);
  }

  if (scopedIds) {
    request = request.in("id", scopedIds);
  }

  if (filter === "residential") {
    request = request.eq("is_company", false);
  }

  if (filter === "commercial") {
    request = request.eq("is_company", true);
  }

  if (filter === "incomplete") {
    request = request.eq("is_incomplete", true);
  }

  if (filter === "overdue") {
    request = request.lt("next_contact", normalizeDateOnly(new Date()));
  }

  const searchTerm = sanitizeSearchTerm(query.search ?? "");
  if (searchTerm) {
    const escaped = searchTerm.replace(/%/g, "");
    request = request.or(
      `display_name.ilike.%${escaped}%,company_name.ilike.%${escaped}%,first_name.ilike.%${escaped}%,last_name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`,
    );
  }

  if (sort === "last_contacted") {
    request = request.order("last_contacted", {
      ascending: false,
      nullsFirst: false,
    });
  } else {
    request = request
      .order("display_name", { ascending: true, nullsFirst: false })
      .order("company_name", { ascending: true, nullsFirst: false })
      .order("last_name", { ascending: true, nullsFirst: false })
      .order("first_name", { ascending: true, nullsFirst: false });
  }

  const { data: clients, error } = await request.limit(200);

  assertNoError(error, "Failed to load clients");

  const clientIds = dedupe((clients ?? []).map((row) => toOptionalString(row.id)));
  const clientTypeIds = dedupe((clients ?? []).map((row) => toOptionalString(row.client_type_id)));

  const [{ data: clientTagRows, error: clientTagError }, clientTypeNameMap] = await Promise.all([
    clientIds.length
      ? supabase
          .from("client_tags")
          .select("client_id,tag_id")
          .eq("org_id", orgId)
          .in("client_id", clientIds)
      : Promise.resolve({ data: [], error: null }),
    getLookupNameMap(orgId, "client_types", clientTypeIds),
  ]);

  assertNoError(clientTagError, "Failed to load client tags");

  const tagIds = dedupe((clientTagRows ?? []).map((row) => toOptionalString(row.tag_id)));
  const tagNameMap = await getLookupNameMap(orgId, "tags", tagIds);

  const tagsByClient = new Map<string, string[]>();
  for (const row of clientTagRows ?? []) {
    const clientId = toOptionalString(row.client_id);
    const tagId = toOptionalString(row.tag_id);
    if (!clientId || !tagId) {
      continue;
    }

    const tagLabel = tagNameMap.get(tagId)?.name;
    if (!tagLabel) {
      continue;
    }

    const existing = tagsByClient.get(clientId) ?? [];
    tagsByClient.set(clientId, [...existing, tagLabel]);
  }

  return (clients ?? []).map((row) => {
    const clientType = clientTypeNameMap.get(toOptionalString(row.client_type_id) ?? "");
    const suggestedDisplayName =
      displayNameSuggestion({
        isCompany: toBoolean(row.is_company),
        companyName: toOptionalString(row.company_name),
        firstName: toOptionalString(row.first_name),
        lastName: toOptionalString(row.last_name),
      }) || null;

    return {
      id: String(row.id),
      displayName: toOptionalString(row.display_name) ?? suggestedDisplayName ?? "Unnamed client",
      isCompany: toBoolean(row.is_company),
      email: toOptionalString(row.email),
      phone: toOptionalString(row.phone),
      isIncomplete: toBoolean(row.is_incomplete),
      clientTypeName: clientType?.name ?? null,
      clientTypeColor: clientType?.color ?? null,
      tagNames: tagsByClient.get(String(row.id)) ?? [],
      lastContacted: toOptionalString(row.last_contacted),
      nextContact: toOptionalString(row.next_contact),
    };
  });
}

export async function getClientDetail(clientId: string): Promise<ClientDetailRecord> {
  const { orgId } = await getViewerContext();
  const supabase = await createClient();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select(
      "id,is_company,company_name,first_name,last_name,display_name,phone,email,is_incomplete,is_previous_customer,has_portal_access,notes,client_type_id,sales_lead,referral_funnel_id,referral_source_id,payment_terms_id,contact_frequency,contact_frequency_days,last_contacted,next_contact",
    )
    .eq("org_id", orgId)
    .eq("id", clientId)
    .maybeSingle();

  assertNoError(clientError, "Failed to load client");

  if (!client) {
    throw new Error("Client not found.");
  }

  const [addressesResult, contactsResult, clientTagsResult, notesResult, tasksResult, communicationsResult] =
    await Promise.all([
      supabase
        .from("client_addresses")
        .select("id,type,is_primary,street_address,city,state,zip,notes")
        .eq("org_id", orgId)
        .eq("client_id", clientId)
        .order("is_primary", { ascending: false }),
      supabase
        .from("client_contacts")
        .select("id,first_name,last_name,phone,email,role,is_primary,notes")
        .eq("org_id", orgId)
        .eq("client_id", clientId)
        .order("is_primary", { ascending: false }),
      supabase
        .from("client_tags")
        .select("tag_id")
        .eq("org_id", orgId)
        .eq("client_id", clientId),
      supabase
        .from("notes")
        .select("id,body,author_id,created_at")
        .eq("org_id", orgId)
        .eq("entity_type", "client")
        .eq("entity_id", clientId)
        .order("created_at", { ascending: false }),
      supabase
        .from("tasks")
        .select("id,title,description,assignee_id,due_date,priority,status")
        .eq("org_id", orgId)
        .eq("entity_type", "client")
        .eq("entity_id", clientId)
        .order("due_date", { ascending: true, nullsFirst: false }),
      supabase
        .from("communications")
        .select("id,method,direction,result,notes,logged_by,occurred_at")
        .eq("org_id", orgId)
        .eq("client_id", clientId)
        .order("occurred_at", { ascending: false }),
    ]);

  assertNoError(addressesResult.error, "Failed to load addresses");
  assertNoError(contactsResult.error, "Failed to load contacts");
  assertNoError(clientTagsResult.error, "Failed to load client tags");
  assertNoError(notesResult.error, "Failed to load notes");
  assertNoError(tasksResult.error, "Failed to load tasks");
  assertNoError(communicationsResult.error, "Failed to load communications");

  const tagIds = dedupe((clientTagsResult.data ?? []).map((row) => toOptionalString(row.tag_id)));
  const noteIds = dedupe((notesResult.data ?? []).map((row) => toOptionalString(row.id)));
  const communicationIds = dedupe(
    (communicationsResult.data ?? []).map((row) => toOptionalString(row.id)),
  );

  const [tagNameMap, noteAttachmentsResult, communicationAttachmentsResult] = await Promise.all([
    getLookupNameMap(orgId, "tags", tagIds),
    noteIds.length
      ? supabase
          .from("note_attachments")
          .select("id,note_id,file_url,file_name,file_type")
          .eq("org_id", orgId)
          .in("note_id", noteIds)
      : Promise.resolve({ data: [], error: null }),
    communicationIds.length
      ? supabase
          .from("communication_attachments")
          .select("id,communication_id,file_url,file_name,file_type")
          .eq("org_id", orgId)
          .in("communication_id", communicationIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  assertNoError(noteAttachmentsResult.error, "Failed to load note attachments");
  assertNoError(
    communicationAttachmentsResult.error,
    "Failed to load communication attachments",
  );

  const employeeIds = dedupe([
    toOptionalString(client.sales_lead),
    ...(notesResult.data ?? []).map((row) => toOptionalString(row.author_id)),
    ...(tasksResult.data ?? []).map((row) => toOptionalString(row.assignee_id)),
    ...(communicationsResult.data ?? []).map((row) => toOptionalString(row.logged_by)),
  ]);

  const [employeeNameMap, clientTypeMap, paymentTermsMap, referralFunnelMap, referralSourceMap] =
    await Promise.all([
      getEmployeeNameMap(orgId, employeeIds),
      getLookupNameMap(orgId, "client_types", dedupe([toOptionalString(client.client_type_id)])),
      getLookupNameMap(orgId, "payment_terms", dedupe([toOptionalString(client.payment_terms_id)])),
      getLookupNameMap(
        orgId,
        "referral_funnels",
        dedupe([toOptionalString(client.referral_funnel_id)]),
      ),
      getLookupNameMap(
        orgId,
        "referral_sources",
        dedupe([toOptionalString(client.referral_source_id)]),
      ),
    ]);

  const noteAttachmentsByNote = new Map<string, ClientDetailRecord["notesFeed"][number]["attachments"]>();
  for (const row of noteAttachmentsResult.data ?? []) {
    const noteId = toOptionalString(row.note_id);
    if (!noteId) {
      continue;
    }

    const existing = noteAttachmentsByNote.get(noteId) ?? [];
    noteAttachmentsByNote.set(noteId, [
      ...existing,
      {
        id: String(row.id),
        fileUrl: String(row.file_url),
        fileName: toOptionalString(row.file_name),
        fileType: toOptionalString(row.file_type),
      },
    ]);
  }

  const communicationAttachmentsByCommunication = new Map<
    string,
    CommunicationRecord["attachments"]
  >();
  for (const row of communicationAttachmentsResult.data ?? []) {
    const communicationId = toOptionalString(row.communication_id);
    if (!communicationId) {
      continue;
    }

    const existing = communicationAttachmentsByCommunication.get(communicationId) ?? [];
    communicationAttachmentsByCommunication.set(communicationId, [
      ...existing,
      {
        id: String(row.id),
        fileUrl: String(row.file_url),
        fileName: toOptionalString(row.file_name),
        fileType: toOptionalString(row.file_type),
      },
    ]);
  }

  const addresses = (addressesResult.data ?? []).map((row) => ({
    id: String(row.id),
    type: row.type as "billing" | "job_site" | "both",
    streetAddress: String(row.street_address),
    city: String(row.city),
    state: String(row.state),
    zip: String(row.zip),
    isPrimary: toBoolean(row.is_primary),
    notes: toOptionalString(row.notes) ?? undefined,
  }));

  const contacts = (contactsResult.data ?? []).map((row) => ({
    id: String(row.id),
    firstName: String(row.first_name),
    lastName: toOptionalString(row.last_name) ?? undefined,
    phone: toOptionalString(row.phone) ?? undefined,
    email: toOptionalString(row.email) ?? undefined,
    role: toOptionalString(row.role) ?? undefined,
    isPrimary: toBoolean(row.is_primary),
    notes: toOptionalString(row.notes) ?? undefined,
  }));

  const clientType = clientTypeMap.get(toOptionalString(client.client_type_id) ?? "");
  const paymentTerms = paymentTermsMap.get(toOptionalString(client.payment_terms_id) ?? "");
  const referralFunnel = referralFunnelMap.get(toOptionalString(client.referral_funnel_id) ?? "");
  const referralSource = referralSourceMap.get(toOptionalString(client.referral_source_id) ?? "");
  const suggestedDisplayName =
    displayNameSuggestion({
      isCompany: toBoolean(client.is_company),
      companyName: toOptionalString(client.company_name),
      firstName: String(client.first_name),
      lastName: String(client.last_name),
    }) || null;

  return {
    id: String(client.id),
    isCompany: toBoolean(client.is_company),
    companyName: toOptionalString(client.company_name),
    firstName: String(client.first_name),
    lastName: String(client.last_name),
    displayName:
      toOptionalString(client.display_name) ?? suggestedDisplayName ?? "Unnamed client",
    phone: toOptionalString(client.phone),
    email: toOptionalString(client.email),
    isIncomplete: toBoolean(client.is_incomplete),
    isPreviousCustomer: toBoolean(client.is_previous_customer),
    hasPortalAccess: toBoolean(client.has_portal_access),
    notes: toOptionalString(client.notes),
    clientTypeId: toOptionalString(client.client_type_id),
    clientTypeName: clientType?.name ?? null,
    clientTypeColor: clientType?.color ?? null,
    salesLeadId: toOptionalString(client.sales_lead),
    salesLeadName:
      employeeNameMap.get(toOptionalString(client.sales_lead) ?? "") ??
      (toOptionalString(client.sales_lead) ? "Unknown employee" : null),
    referralFunnelId: toOptionalString(client.referral_funnel_id),
    referralFunnelName: referralFunnel?.name ?? null,
    referralSourceId: toOptionalString(client.referral_source_id),
    referralSourceName: referralSource?.name ?? null,
    paymentTermsId: toOptionalString(client.payment_terms_id),
    paymentTermsName: paymentTerms?.name ?? null,
    contactFrequency: toOptionalString(client.contact_frequency),
    contactFrequencyDays:
      typeof client.contact_frequency_days === "number"
        ? client.contact_frequency_days
        : null,
    lastContacted: toOptionalString(client.last_contacted),
    nextContact: toOptionalString(client.next_contact),
    addresses,
    contacts,
    tags: tagIds
      .map((tagId) => {
        const entry = tagNameMap.get(tagId);
        if (!entry) {
          return null;
        }

        return {
          id: tagId,
          name: entry.name,
          color: entry.color,
        };
      })
      .filter(
        (
          entry,
        ): entry is {
          id: string;
          name: string;
          color: string | null;
        } => Boolean(entry),
      ),
    notesFeed: (notesResult.data ?? []).map((row) => ({
      id: String(row.id),
      body: String(row.body),
      createdAt: toOptionalString(row.created_at),
      authorName:
        employeeNameMap.get(toOptionalString(row.author_id) ?? "") ?? "Unknown employee",
      attachments: noteAttachmentsByNote.get(String(row.id)) ?? [],
    })),
    tasksFeed: (tasksResult.data ?? []).map((row) => ({
      id: String(row.id),
      title: String(row.title),
      description: toOptionalString(row.description),
      assigneeName:
        employeeNameMap.get(toOptionalString(row.assignee_id) ?? "") ?? "Unassigned",
      dueDate: toOptionalString(row.due_date),
      priority: String(row.priority),
      status: String(row.status),
    })),
    communications: (communicationsResult.data ?? []).map((row) => ({
      id: String(row.id),
      method: String(row.method),
      direction: String(row.direction),
      result: toOptionalString(row.result),
      notes: toOptionalString(row.notes),
      occurredAt: String(row.occurred_at),
      loggedByName:
        employeeNameMap.get(toOptionalString(row.logged_by) ?? "") ?? "Unknown employee",
      attachments: communicationAttachmentsByCommunication.get(String(row.id)) ?? [],
    })),
  };
}

export async function saveClient(input: SaveClientInput): Promise<string> {
  const { orgId } = await getViewerContext();
  const supabase = await createClient();

  const firstName = input.firstName.trim();
  const lastName = input.lastName.trim();
  const companyName = input.companyName?.trim() ?? "";

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required.");
  }

  if (input.isCompany && !companyName) {
    throw new Error("Company name is required for commercial clients.");
  }

  const addresses = sanitizeAddresses(input.addresses);
  const contacts = sanitizeContacts(input.contacts);

  if (!addresses.length) {
    throw new Error("At least one complete address is required.");
  }

  const dedupedTagIds = dedupe(input.tagIds);
  const isIncomplete = determineIncompleteStatus({
    isCompany: input.isCompany,
    companyName,
    firstName,
    lastName,
    phone: input.phone,
    email: input.email,
    addresses,
    contacts,
  });

  const clientPayload = {
    org_id: orgId,
    is_company: input.isCompany,
    company_name: companyName || null,
    first_name: firstName,
    last_name: lastName,
    display_name: input.displayName?.trim() || null,
    phone: input.phone?.trim() || null,
    email: input.email?.trim() || null,
    client_type_id: input.clientTypeId || null,
    sales_lead: input.salesLead || null,
    referral_funnel_id: input.referralFunnelId || null,
    referral_source_id: input.referralSourceId || null,
    payment_terms_id: input.paymentTermsId || null,
    contact_frequency: input.contactFrequency || null,
    contact_frequency_days:
      input.contactFrequency === "custom" && input.contactFrequencyDays
        ? input.contactFrequencyDays
        : null,
    is_previous_customer: input.isPreviousCustomer,
    has_portal_access: input.hasPortalAccess,
    notes: input.notes?.trim() || null,
    is_incomplete: isIncomplete,
  };

  let clientId = input.id;

  if (clientId) {
    const { data, error } = await supabase
      .from("clients")
      .update(clientPayload)
      .eq("org_id", orgId)
      .eq("id", clientId)
      .select("id")
      .single();

    assertNoError(error, "Failed to update client");
    if (!data) {
      throw new Error("Client update did not return a record.");
    }
    clientId = String(data.id);
  } else {
    const { data, error } = await supabase
      .from("clients")
      .insert(clientPayload)
      .select("id")
      .single();

    assertNoError(error, "Failed to create client");
    if (!data) {
      throw new Error("Client create did not return a record.");
    }
    clientId = String(data.id);
  }

  const [deleteAddressesResult, deleteContactsResult, deleteTagsResult] = await Promise.all([
    supabase.from("client_addresses").delete().eq("org_id", orgId).eq("client_id", clientId),
    supabase.from("client_contacts").delete().eq("org_id", orgId).eq("client_id", clientId),
    supabase.from("client_tags").delete().eq("org_id", orgId).eq("client_id", clientId),
  ]);

  assertNoError(deleteAddressesResult.error, "Failed to update addresses");
  assertNoError(deleteContactsResult.error, "Failed to update contacts");
  assertNoError(deleteTagsResult.error, "Failed to update tags");

  if (addresses.length) {
    const { error } = await supabase.from("client_addresses").insert(
      addresses.map((address) => ({
        org_id: orgId,
        client_id: clientId,
        type: address.type,
        is_primary: address.isPrimary,
        street_address: address.streetAddress,
        city: address.city,
        state: address.state,
        zip: address.zip,
        notes: address.notes?.trim() || null,
      })),
    );

    assertNoError(error, "Failed to save addresses");
  }

  if (contacts.length) {
    const { error } = await supabase.from("client_contacts").insert(
      contacts.map((contact) => ({
        org_id: orgId,
        client_id: clientId,
        first_name: contact.firstName,
        last_name: contact.lastName || null,
        phone: contact.phone || null,
        email: contact.email || null,
        role: contact.role || null,
        is_primary: contact.isPrimary,
        notes: contact.notes || null,
      })),
    );

    assertNoError(error, "Failed to save contacts");
  }

  if (dedupedTagIds.length) {
    const { error } = await supabase.from("client_tags").insert(
      dedupedTagIds.map((tagId) => ({
        org_id: orgId,
        client_id: clientId,
        tag_id: tagId,
      })),
    );

    assertNoError(error, "Failed to save tags");
  }

  return clientId;
}

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function uploadCommunicationAttachment(input: {
  clientId: string;
  communicationId: string;
  orgId: string;
  file: File;
}): Promise<string> {
  const supabase = await createClient();
  const safeName = sanitizeFileName(input.file.name || "attachment");
  const filePath = `${input.orgId}/clients/${input.clientId}/${input.communicationId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(COMMUNICATION_ATTACHMENT_BUCKET)
    .upload(filePath, input.file, {
      contentType: input.file.type || undefined,
      upsert: false,
    });

  assertNoError(uploadError, "Failed to upload communication attachment");

  const { data } = supabase.storage
    .from(COMMUNICATION_ATTACHMENT_BUCKET)
    .getPublicUrl(filePath);

  return data.publicUrl || `${COMMUNICATION_ATTACHMENT_BUCKET}/${filePath}`;
}

export async function createCommunication(input: CreateCommunicationInput): Promise<void> {
  const context = await getViewerContext();
  const supabase = await createClient();

  const occurredAt = new Date(input.occurredAt);
  if (Number.isNaN(occurredAt.getTime())) {
    throw new Error("Invalid communication date.");
  }

  const occurredAtIso = occurredAt.toISOString();

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id,contact_frequency,contact_frequency_days")
    .eq("org_id", context.orgId)
    .eq("id", input.clientId)
    .maybeSingle();

  assertNoError(clientError, "Failed to load client before communication log");

  if (!client) {
    throw new Error("Client not found.");
  }

  const { data: communication, error: insertError } = await supabase
    .from("communications")
    .insert({
      org_id: context.orgId,
      client_id: input.clientId,
      method: input.method,
      direction: input.direction,
      result: input.result || null,
      notes: input.notes?.trim() || null,
      occurred_at: occurredAtIso,
      logged_by: context.employeeId,
    })
    .select("id")
    .single();

  assertNoError(insertError, "Failed to create communication");
  if (!communication) {
    throw new Error("Communication insert did not return a record.");
  }

  const communicationId = String(communication.id);

  if (input.attachment && input.attachment.size > 0) {
    const fileUrl = await uploadCommunicationAttachment({
      clientId: input.clientId,
      communicationId,
      orgId: context.orgId,
      file: input.attachment,
    });

    const { error: attachmentError } = await supabase
      .from("communication_attachments")
      .insert({
        org_id: context.orgId,
        communication_id: communicationId,
        file_url: fileUrl,
        file_name: input.attachment.name || null,
        file_type: input.attachment.type || null,
      });

    assertNoError(attachmentError, "Failed to save communication attachment record");
  }

  const lastContacted = normalizeDateOnly(occurredAtIso);
  const nextContact = calculateNextContactDate({
    lastContacted,
    contactFrequency: toOptionalString(client.contact_frequency),
    contactFrequencyDays:
      typeof client.contact_frequency_days === "number"
        ? client.contact_frequency_days
        : null,
  });

  const { error: updateError } = await supabase
    .from("clients")
    .update({
      last_contacted: lastContacted,
      next_contact: nextContact,
    })
    .eq("org_id", context.orgId)
    .eq("id", input.clientId);

  assertNoError(updateError, "Failed to update client contact schedule");
}

export async function safeGetClientDetail(clientId: string): Promise<{
  data: ClientDetailRecord | null;
  error: string | null;
}> {
  try {
    const data = await getClientDetail(clientId);
    return { data, error: null };
  } catch (error) {
    return { data: null, error: stringifyError(error) };
  }
}
